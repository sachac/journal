const process = require('process');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fastCsv = require('fast-csv');
require('dotenv').config({path: path.join(__dirname, '../.env')});
const app = express();
const parse = require('csv-parse');
const bodyParser = require('body-parser');
const moment = require('moment');
const stringify = require('csv-stringify/lib/sync');
const sharp = require('sharp');
const columns = ["Note","Category","Pictures","Date","highlight week","Time","Link","ID","Status","Other", "ZID", "ZIDString"];
const THUMBNAIL_WIDTH = 1000;
const mongoose = require('mongoose');

// Serve the static files from the React app
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../build')));
app.use('/thumbnails', express.static(process.env.PICS_DIR));
app.use('/thumbnails', express.static(process.env.CAMERA_DIR));
if (process.env.SKETCHES_DIR) {
  app.use('/thumbnails', express.static(process.env.SKETCHES_DIR));
  const findImageByFilename = async (filename) => {
    let sketches = await fs.readdir(process.env.SKETCHES_DIR);
    let id = filename.match(/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9][a-z]/);
    let m = filename.match(/^[^#]+/);
    if (id) {
      return sketches.find((x) => x.startsWith(id));
    } else if (m) {
      return sketches.find((x) => x.startsWith(m[0]));
    } else {
      return null;
    }
  };
  app.use('/thumbnails/:filename', async (req, res) => {
    let filename = await findImageByFilename(req.params.filename);
    if (filename) {
      res.sendFile(path.join(process.env.SKETCHES_DIR, path.basename(filename)));
    }
  });
};

async function saveEntries(entries) {
    var changed = entries.filter((d) => { return d.Status; });
    await fs.writeFile(process.env.JOURNAL_FILE,
                       stringify(changed,
                                 {header: true, columns: columns}));
}

function filterPrivateEntries(data) {
    return data.filter((d) => {
        return !d.Note.match(/^!/)
            && d.Category != 'Consulting'
            && d.Category != 'KGA'
            && d.Category != 'Track'
            && d['highlight week'] == 'true';
    });
}

function readEntriesFromFile(journal) {
    return fs.readFile(journal).then((file) => {
        return new Promise((resolve, reject) => {
            parse(file, {columns: true}, (err, data) => {
                data = data.map((d) => {
                    d.PictureList = (d.Pictures || '').split(/,/g).map((p) => {
                        var matches = p.match(/[^/]+$/);
                        if (matches) {
                            return matches[0];
                        } else {
                            return null;
                        }
                    }).filter((d) => { return d; });
                    return d;
                });
                // if (!options.private) {
                //     data = filterPrivateEntries(data);
                // } 
                resolve(data);
            });
        });
    });
}

// An api endpoint that returns a short list of items
app.get('/api/getList', (req,res) => {
    var list = ["item1", "item2", "item3"];
    res.json(list);
});

const entriesMatchingDate = (date) => { return (d) => { return d.Date.replace(/-/g, '').match(date); }; };

app.delete('/api/pictures/:filename', async (req, res) => {
    var result = await Picture.findOneAndUpdate({filename: req.params.filename},
                                                {filename: path.basename(req.params.filename),
                                                 date: getDateFromFilename(path.basename(req.params.filename)),
                                                 status: 'Deleted'}, {upsert: true}).exec();
    res.sendStatus(result ? 200 : 404);
});

async function getNextZID(rec) {
    let date = rec.Date || rec;
    let latest = await Entry.findOne({ Date: getDaySpan(date), ZID: {$ne: null}}).sort([['ZID', -1], ['ID', -1]]).exec();
    if (latest) {
        if (latest.ZID) {
            if (moment(latest.Date).format('YYYY-MM-DD') == moment(date).format('YYYY-MM-DD')) {
                return latest.ZID + 1;
            } else {
                return 1;
            }
        } else {
            return 1;
        }
    } else {
        return 1;
    }
}

function formatZIDString(d) {
    return moment(d.Date).format('YYYY-MM-DD-') + (d.ZID < 10 ? '0' : '') + d.ZID;
}

app.post('/api/updateZIDs', async (req, res) => {
    await updateZIDs(req.body.count || 100);
    res.send(200);
});

async function updateZIDs(count) {
    const cursor = Entry.find({ZID: null}).sort([['Date', 1], ['ID', 1]]).limit(count).cursor();
    await cursor.eachAsync(async function(d) {
        d.ZID = await getNextZID(d);
        d.ZIDString = formatZIDString(d);
        await d.save();
    });
}

function getDaySpan(date) {
    if (typeof date == 'string') {
        date = date.replace(/[^0-9]/g, '');
        if (date.length == 6) {
            let dateToMatch = moment(date + '01', 'YYYYMMDD').startOf('day');
            let lt = moment(dateToMatch).add(1, 'months').toDate();
            return {$gte: dateToMatch.toDate(), $lt: lt};
        } else {
            let dateToMatch = moment(date, 'YYYYMMDD').startOf('day');
            let lt = moment(dateToMatch).add(1, 'days').toDate();
            return {$gte: dateToMatch.toDate(), $lt: lt};
        }
    } else {
        let dateToMatch = moment(date).startOf('day');
        let lt = moment(dateToMatch).add(1, 'days').toDate();
        return {$gte: dateToMatch.toDate(), $lt: lt};
    }
}

async function maybeAddImages(oldList, directory, filter) {
  if (!directory) { return oldList; }
  let list = await fs.readdir(directory);
  list = list.filter((f) => !f.match(/\.xmp$/));
  if (filter.date) {
    list = list.filter((f) => {
      let date = getDateFromFilename(f);
      if (date) {
        if (filter.date.$gte && date.isBefore(filter.date.$gte)) { return null; }
        if (filter.date.$lt && date.isAfter(filter.date.$lt)) { return null; }
        return true;
      } else { return null; }
    });
  }
  list.forEach((f) => {
    // Is it already in the existing list?
    if (!oldList.find(e => e.filename == f)) {
      oldList.push({filename: f, date: getDateFromFilename(f).toDate(), status: 'Draft'});
    }
  });
  return oldList;
}

async function getPhotos(params) {
  let filter = {date: getDateParams(params)};
  let list = await Picture.find(filter).exec();
  list = await maybeAddImages(list, process.env.CAMERA_DIR, filter);
  list = await maybeAddImages(list, process.env.SKETCHES_DIR, filter);
  return list.filter(x => x.status != 'Deleted');
}

async function getEntries(params) {
    let dateParams = getDateParams(params);
    let search = {Status: {$ne: 'Deleted'}};
    if (dateParams) { search['Date'] = dateParams; }
    let sort = {'Date': -1};
    let entries;
    if (params.zidre) {
        search['ZIDString'] = {$regex: new RegExp(params.zidre)};
    }
    if (params.zid) {
        search['ZIDString'] = params.zid;
    }
    if (params.withPhotos && params.withPhotos !== '0') {
        search['Pictures'] = {'$ne': ''};
    }
    if (params.q) {
        if (params.regex && params.regex !== '0') {
            search['$or'] = [
                { 'Note': {$regex: new RegExp(params.q)} },
                { 'Other': {$regex: new RegExp(params.q)} }
            ];
            entries = Entry.find(search).sort({'Date': -1});
        } else {
            search['$text'] = {$search: params.q};
            if (params.sort == 'score') {
                sort = {"score": { "$meta": "textScore" }};
            } else {
                sort = { "Date": -1 };
            }
            entries = Entry.find(search, { "score": { "$meta": "textScore" } }).sort(sort);
        }
    } else if (params.random) {
        return await Entry.aggregate([{ $match: search }, { $sample: { size: parseInt(params.count || params.limit || '10') } }]);
    } else {
        entries = Entry.find(search).sort(sort);
    }
    if (params.limit) { entries = entries.limit(parseInt(params.limit)); }
    return entries.exec();  
}

app.get('/api/date/:date', async (req, res) => {
    var date = (req.params.date || '').replace(/[^0-9]/g, '');
    var filter = getDaySpan(date);
    var photos = await getPhotos(req.params);
    var dayEntries = await getEntries(req.params);
    var linkedPhotos = dayEntries.reduce((old, e) => { return old.concat(e.PictureList); }, []);
    var unlinkedPhotos = photos.filter((d) => { return linkedPhotos.indexOf(d.filename) < 0; });
    res.json({
        photos: photos,
        linkedPhotos: linkedPhotos,
        unlinkedPhotos: unlinkedPhotos,
        entries: dayEntries});
});
app.get('/api/date/:date/photos', async (req, res) => {
    var date = (req.params.date || '').replace(/[^0-9]/g, '');
    var filter = getDaySpan(req.params.date);
    var photos = await getPhotos({date: filter});
    var dayEntries = await getEntries(req.params);
    var linkedPhotos = dayEntries.reduce((old, e) => { return old.concat(e.PictureList); }, []);
    var unlinkedPhotos = photos.filter((d) => { return linkedPhotos.indexOf(d) < 0; });
    res.json({
        photos: photos,
        linkedPhotos: linkedPhotos,
        unlinkedPhotos: unlinkedPhotos});
});
app.get('/api/photos', async (req, res) => {
    let search = {Status: {$ne: 'Deleted'}, Date: getDateParams(req.query)};
    let photos = await getPhotos(search);
    res.json(photos);
});

function getDateParams(params) {
    let d = {}, has = false;
    if (params.from) {
        d.$gte = moment(params.from).toDate();
        has = true;
    }
    if (params.to) {
        d.$lt = moment(params.to).toDate();
        has = true;
    }
    if (params.date) {
        return getDaySpan(params.date);
    }
    return has ? d : null;
}

app.get('/api/combined', async (req, res) => {
    let search = {Status: {$ne: 'Deleted'}, Date: getDateParams(req.query)};
    let start = search.Date.$gte.replace(/[^0-9]/g, '');
    let end = search.Date.$lt.replace(/[^0-9]/g, '');
    var photos = await getPhotos({date: getDateParams(req.dateQuery)});
    var dayEntries = await getEntries(req.params);
    var linkedPhotos = dayEntries.reduce((old, e) => { return old.concat(e.PictureList); }, []);
    var unlinkedPhotos = photos.filter((d) => { return linkedPhotos.indexOf(d) < 0; });
    res.json({
        photos: photos,
        filter: getDaySpan(req.params.date),
        linkedPhotos: linkedPhotos,
        unlinkedPhotos: unlinkedPhotos,
        entries: dayEntries});
});

app.get('/api/entries', async (req, res) => {
  res.json(await getEntries(req.query));
});

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

app.get('/api/onThisDay/:month/:day?', async (req, res) => {
    let re = '^[0-9]+-' + pad(parseInt(req.params.month), 2) + '-' +
        (req.params.day ? pad(parseInt(req.params.day), 2, 0) : '[0-9][0-9]') + '-[0-9]+';
    res.json(await getEntries({zidre: re}));
});

app.get('/api/entries.csv', async (req, res) => {
    res.send(await fastCsv.writeToString(await getEntries(req.query), {columns: columns, transform: csvTransformer, headers: columns, writeHeaders: true}));
});

app.get('/api/entries/random', async (req, res) => {
    res.json(await Entry.aggregate([{ $match: { Status: {$ne: 'Deleted'} } }, { $sample: { size: req.query.count || req.query.limit || 10 } }]).exec());
});
app.get('/api/entries/uncategorized', async (req, res) => {
    var count = req.query.count || req.query.limit || 50;
    var entries = Entry.find({Category: null, Status: {$ne: 'Deleted'}}).sort({Date: -1}).limit(parseInt(count)).exec();
    res.json(entries);
});
app.get('/api/entries/incomplete', async (req, res) => {
    var count = req.query.count || req.query.limit || 50;
    var entries = await Entry.find({Category: {$nin: ['Consulting', 'Track', 'Oops']},
                                    Status: {$ne: 'Deleted'},
                                    Level: {$gt: 1},
                                    Note: {$regex: /^[a-z].*[^\.!)"][ \t\r\n]*$/}})
        .sort({Date: -1}).limit(parseInt(count)).exec();
    res.json(entries);
});

app.get('/api/entries/:id', async (req, res) => {
    if (req.params.id.match(/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-[0-9][0-9]$/)) {
        res.json(await Entry.findOne({ZIDString: req.params.id}).exec());
    } else {
        res.json(await Entry.findOne({ID: req.params.id}).exec());
    }
});

async function createPictureRecord(filename) {
    let p = await preparePictureRecord(filename);
    return p && p.save();
}

function getDateFromFilename(filename) {
  let digits = filename.replace(/[^0-9]/g, '');
  if (digits.length >= 14 && digits.match(/^20/)) {
    let date = moment(digits.substring(0, 14), 'YYYYMMDDHHmmss');
    return date.isValid() && date;
  }
  else if (digits.length >= 8 && digits.match(/^20/)) {
    let date = moment(digits.substring(0, 8) + '120000', 'YYYYMMDDHHmmss');
    return date.isValid() && date;
  }
  else {
    return null;
  }
}

async function preparePictureRecord(filename) {
    if (filename.match(/\.xmp/)) return null;
    let date = getDateFromFilename(filename);
    if (date) {
        var e = await Picture.findOne({filename: filename}).exec();
        if (e) { return null; }
        let found = await Entry.findOne({PictureList: {$elemMatch: {$eq: filename}}}).exec();
        return new Picture({filename: filename, date: date.toDate(), link: found && found._id});
    }
    else {
        return null;
    }
}

async function updatePictureRecords() {
    let files = await fs.readdir(process.env.PICS_DIR);
    let list = (await Picture.find().exec()).map(f => f.filename);
    let newImages = files.filter(f => !list.includes(f) && !f.match(/.xmp$/));
    console.log('Creating picture records', newImages);
    await Promise.all(newImages.map(createPictureRecord));
    console.log('Done.');
}

async function makeThumbnail(o) {
    return fs.access(process.env.PICS_DIR + path.basename(o))
            .then(function() { })
            .catch(function(err) {
                if (!o.match(/\.jpg$/)) return null;
                console.log('Resizing ' + o);
                return sharp(process.env.CAMERA_DIR + o, { failOnError: false })
                    .resize(THUMBNAIL_WIDTH)
                    .toFile(process.env.PICS_DIR + path.basename(o))
                    .then(() => {
                        return path.basename(o);
                    }).catch((e) => {
                        return null;
                    });
            });
}

async function makeThumbnails() {
    console.log('Making thumbnails...');
    var orig = await fs.readdir(process.env.CAMERA_DIR);
    var list = orig.map(makeThumbnail);
    await Promise.all(list);
    console.log('Done making thumbnails.');
    return list.map((p) => { return p.value; }).filter(p => p);
}

app.get('/api/makeThumbs', async (req, res) => {
    var list = await makeThumbnails();
    await updatePictureRecords();
    res.json(list);
});

app.post('/api/makeThumbs', async (req, res) => {
    var list = await makeThumbnails();
    await updatePictureRecords();
    res.json(list);
});

async function updateEntry(entry) {
    await Entry.findOneAndUpdate({ID: entry.ID}, entry, {upsert: true}).exec();
}


app.put('/api/entries/:id', async (req, res) => {
    var e = await Entry.findOne({ID: req.body.ID || req.params.id}).exec();
    let oldDate = moment(e.Date).format('YYYY-MM-DD');
    e = {...e.toObject(), ...req.body};
    if (e.Pictures) {
        e.PictureList = [...new Set(e.Pictures.split(/,/))];
        // Make thumbnails if they don't exist
        await Promise.all(e.PictureList.map(makeThumbnail));
        await Promise.all(e.PictureList.map(createPictureRecord));
    }
    if (e.Time) {
        e.Date = moment(moment(e.Date).format('YYYY-MM-DD') + ' ' + e.Time).toDate();
    }
    if (e.Status != 'New') {
        e.Status = 'Updated';
    }
    if (moment(e.Date).format('YYYY-MM-DD') != oldDate) {
        e.ZID = await getNextZID(e);
        e.ZIDString = formatZIDString(e);
    }
    await Entry.replaceOne({ID: req.body.ID || req.params.id}, e);
    res.json(e);
});

app.delete('/api/entries/:id', async (req, res) => {
    var result = await Entry.updateOne({ID: req.params.id}, {$set: {Status: 'Deleted'}});
    if (result.n == 1) {
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

async function linkPictures(id, filenames) {
    var e = await Entry.findOne({ID: id}).exec();
    filenames = filenames.map(d => path.basename(d));
    if (e) {
        if (!e.PictureList) { e.PictureList = []; }
        e.PictureList = [...new Set(e.PictureList.concat(filenames))];
        e.Pictures = e.PictureList.join(',');
        if (e.Status != 'New') { e.Status = 'Updated'; }
        await e.save();
        // Make thumbnails if they don't exist
        await Promise.all(filenames.map(makeThumbnail));
        await Promise.all(filenames.map(createPictureRecord));
        return e;
    }
    else {
        return null;
    }
}

app.post('/api/entries/:id/pictures', async (req, res) => {
    let result = await linkPictures(req.params.id, req.body.filename ? [req.body.filename] : req.body.filenames);
    if (result) { res.json(result); }
    else { res.send(404); }
});
app.delete('/api/entries/:id/pictures', async (req, res) => {
    var e = await Entry.findOne({ID: req.params.id}).exec();
    if (e) {
        if (req.body.filenames) {
            e.PictureList = e.PictureList.filter((f) => (!req.body.filenames.includes(f)));
        }
        if (req.body.filename) {
            e.PictureList = e.PictureList.filter((f) => { return f != req.body.filename; });
        }
        e.Pictures = e.PictureList.join(',');
        if (e.Status != 'New') { e.Status = 'Updated'; }
        
        await Entry.replaceOne({ID: req.params.ID}, e);
        res.json(e);
    }
    else {
        res.send(404);
    }
});

async function createEntry(e) {
    if (e.Date) {
        if (e.Time) {
            e.Date = moment(e.Date + ' ' + e.Time).toDate();
        }
    } else {
        e.Date = new Date();
    }
    let counter = await Counter.findOne({name: 'entryID'}).exec();
    e.ID = counter.value + 1;
    await Counter.updateOne({name: 'entryID'}, {$set: {value: e.ID}}).exec();
    e.Status = 'New';
    e.PictureList = [...new Set(e.PictureList)];
    e.Pictures = e.PictureList.join(',');
    let newEntry = new Entry(e);
    newEntry.ZID = await getNextZID(newEntry);
    newEntry.ZIDString = formatZIDString(newEntry);
    await newEntry.save();
    if (e.PictureList) {
        await Promise.all(e.PictureList.map(makeThumbnail));
        await Promise.all(e.PictureList.map(createPictureRecord));
    }
    return newEntry;
}

app.post('/api/entries', async (req, res) => {
    var e = req.body;
    if (e.Pictures) {
        e.PictureList = e.Pictures.split(/,/);
    }
    res.send(createEntry(e));
});

app.get('/api/date/:date/entries', async (req, res) => {
    var date = (req.params.date || '').replace(/[^0-9]/g, '');
    res.json(await getEntries(req.params));
});

async function getPhotosFromDir(dir) {
    var list = await fs.readdir(dir);
    var deleted = (await Picture.find({status: 'Deleted'}).exec()).map(d => d.Filename);
    return list.filter(d => !deleted.includes(d));
}

app.post('/api/reload', async (req, res) => {
    req.app.locals.photos = await getPhotosFromDir(process.env.PICS_DIR);
    req.app.locals.fullsize = await getPhotosFromDir(process.env.CAMERA_DIR);
    res.sendStatus(200);
});

app.post('/api/importIntoDB', async (req, res) => {
    await importEntriesIntoDB(await readEntriesFromFile(process.env.JOURNAL_FILE));
    res.json({count: Entry.countDocuments().exec()});
});
async function importEntriesIntoDB(entries) {
    var max = 0;
    var list = entries.map((e) => {
        if (typeof e.Date == 'string') {
            e.Date = moment(e.Date + ' ' + (e.Time || '00:00:00')).toDate();
        }
        if (e['highlight week'] == 'false') {
            e.Level = 1;
        } else {
            e.Level = 2;
        }
        e.ID = parseInt(e.ID);
        if (e.ID > max) {
            max = e.ID;
        }
        return {updateOne: {'filter': {ID: e.ID}, update: e, upsert: true}};
    });
    await Entry.bulkWrite(list);
    await Counter.findOneAndUpdate({name: 'entryID'}, {name: 'entryID', value: max}, {upsert: true}).exec();
    let count = await Entry.countDocuments().exec();
}

const csvTransformer = (doc) => {
  return {
    Note: doc.Note,
    Category: doc.Category,
    Pictures: doc.Pictures,
    Date: moment(doc.Date).format('YYYY-MM-DD'),
    'highlight week': doc.Level >= 2,
    Time: moment(doc.Date).format('HH:mm:ss'),
    Link: null,
    ID: doc.ID,
    Status: doc.Status,
    Other: doc.Other,
    ZID: doc.ZID,
    ZIDString: doc.ZIDString
  };
};

async function writeCSV() {
    let entries = await Entry.find().sort({Date: -1}).exec();
    await fastCsv.writeToPath(process.env.FOR_IMPORT, entries, {headers: columns, transform: csvTransformer});
    return { entries: entries };
}

app.post('/api/export', async (req, res) => {
    await writeCSV();
    res.sendStatus(200);
});

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

const port = process.env.PORT || 5001;
async function run() {
    //console.log(await makeThumbnails());
    //await updatePictureRecords();
    app.locals.photos = (await Picture.find({Status: {$ne: 'Deleted'}}).exec()).map(f => f.filename);
    app.listen(port);
    console.log('App is listening on port ' + port);
}

const EntrySchema = new mongoose.Schema({
    ID: { type: Number },
    Note: { type: String },
    Category: { type: String },
    Pictures: { type: String },
    PictureList: { type: Array },
    Level: { type: Number },
    Date: { type: Date },
    Time: { type: String },
    Other: { type: String },
    Status: { type: String },
    ZID: { type: Number },
    ZIDString: { type: String }
});
EntrySchema.index({'$**': 'text'});

const PictureSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    status: { type: String, default: null },
    date: { type: Date },
    link: { type: mongoose.Schema.ObjectId }
});
const Picture = mongoose.model('picture', PictureSchema);
const Entry = mongoose.model('entry', EntrySchema);
const CounterSchema = new mongoose.Schema({value: Number, name: String});
const Counter = mongoose.model('counter', CounterSchema);

mongoose
    .connect(process.env.MONGODB, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true })
    .then(() => { console.log('MongoDB Connected'); run(); })
    .catch(err => console.log(err));

