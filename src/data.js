const mongoose = require('mongoose');
const fs = require('fs').promises;
const process = require('process');
const stringify = require('csv-stringify/lib/sync');
const columns = ["Note","Category","Pictures","Date","highlight week","Time","Link","ID","Status","Other", "ZID", "ZIDString"];
const path = require('path');
const moment = require('moment');
const fastCsv = require('fast-csv');
const sharp = require('sharp');
const THUMBNAIL_WIDTH = 1000;

const EntrySchema = new mongoose.Schema({
  ID: { type: Number },
  Note: { type: String },
  Category: { type: String },
  Pictures: { type: String },
  PictureList: { type: [String] },
  Level: { type: Number },
  Date: { type: Date },
  Time: { type: String },
  isPrivate: { type: Boolean },
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
module.exports.Entry = Entry;
module.exports.Picture = Picture;
module.exports.Counter = Counter;

async function saveEntries(entries) {
  var changed = entries.filter((d) => { return d.Status; });
  await fs.writeFile(process.env.JOURNAL_FILE,
                     stringify(changed,
                               {header: true, columns: columns}));
}

function isPublic(d) {
  return !(d.Note && d.Note.match(/^!/))
    && d.Category != 'Consulting'
    && d.Category != 'KGA'
    && d.Category != 'Track';
}

function filterPrivateEntries(data) {
  return data.filter(isPublic);
}

function annotateEntry(o) {
  o.isPrivate = !isPublic(o);
  return o;
}
function annotateEntries(data) {
  return data.map(annotateEntry);
}

function findOriginalPicture(o) {
  return imageDirs.reduce((prevPromise, cur) => {
    return prevPromise.then(async (acc) => {
      if (acc) return acc;
      let f = await findImageInDir(cur, o);
      return f;
    });
  }, Promise.resolve(null));
}
module.exports.findOriginalPicture = findOriginalPicture;

function findImageInDir(dir, filename) {
  return fs.readdir(dir).then((sketches) => {
    let id = filename.match(/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9][a-z]/);
    let m = filename.replace(/\.(jpg|png)$/, '').match(/^[^#]+/);
    let f = null;
    if (id) {
      f = sketches.find((x) => x.startsWith(id));
    } else if (m) {
      f = sketches.find((x) => x.startsWith(m[0]));
    }
    if (f) {
      return path.join(dir, f);
    } else {
      return null;
    }
  });
};
module.exports.findImageInDir = findImageInDir;

const imageDirs = (process.env.IMAGE_DIRS || '').split(':');
module.exports.imageDirs = imageDirs;

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

async function updateZIDs(count) {
  const cursor = Entry.find({ZID: null}).sort([['Date', 1], ['ID', 1]]).limit(count).cursor();
  await cursor.eachAsync(async function(d) {
    d.ZID = await getNextZID(d);
    d.ZIDString = formatZIDString(d);
    await d.save();
  });
}
module.exports.updateZIDs = updateZIDs;

async function deletePicture(filename) {
  return Picture.findOneAndUpdate({filename: filename},
                                        {filename: path.basename(filename),
                                         date: getDateFromFilename(path.basename(filename)),
                                         status: 'Deleted'}, {upsert: true}).exec();

}
module.exports.deletePicture = deletePicture;

async function maybeAddImages(oldList, directory, filter) {
  if (!directory) { return oldList; }
  let list = await fs.readdir(directory);
  list = list.filter((f) => f.match(/\.(jpg|png)$/i));
  list = list.filter((f) => {
    let date = getDateFromFilename(f);
    if (date) {
      if (filter.date) {
        if (filter.date.$gte && date.isBefore(filter.date.$gte)) { return null; }
        if (filter.date.$lt && date.isAfter(filter.date.$lt)) { return null; }
      }
      return true;
    } else { return null; }
  });
  list.forEach((f) => {
    let date = getDateFromFilename(f);
    // Is it already in the existing list?
    if (!oldList.find(e => e.filename == f)) {
      oldList.push({filename: f, date: date && date.toDate(), status: 'Draft'});
    }
  });
  return oldList;
}

async function getPhotos(params) {
  let dateParams = getDateParams(params);
  let filter = dateParams ? {date: dateParams} : {};
  let list = await Picture.find(filter).exec();
  list = await imageDirs.reduce((prevPromise, dir) => {
    return prevPromise.then(async (list) => {
      return await maybeAddImages(list, dir, filter);
    });
  }, Promise.resolve(list));
  return list.filter(x => x.status != 'Deleted');
}

async function getDateData(params) {
  var date = (params.date || '').replace(/[^0-9]/g, '');
  var filter = getDaySpan(date);
  var photos = await getPhotos(params);
  var dayEntries = await getEntries(params);
  var linkedPhotos = dayEntries.reduce((old, e) => { return old.concat(e.PictureList); }, []);
  var unlinkedPhotos = photos.filter((d) => { return !linkedPhotos.includes(d.filename); });
  return {
    photos: photos,
    linkedPhotos: linkedPhotos,
    unlinkedPhotos: unlinkedPhotos,
    entries: dayEntries};
}
module.exports.getDateData = getDateData;
async function getOnThisDayData(date) {
  date = (date || '').replace(/[^-0-9]/g, '');
  var photos = []; //(await getPhotos()).filter((o) => moment(o.Date).format('MM-DD') == date);
  var dayEntries = await getEntries({zidre: '^[0-9][0-9][0-9][0-9]-' + date});
  var linkedPhotos = dayEntries.reduce((old, e) => { return old.concat(e.PictureList); }, []);
  var unlinkedPhotos = photos.filter((d) => { return linkedPhotos.indexOf(d.filename) < 0; });
  return {
    photos: photos,
    linkedPhotos: linkedPhotos,
    unlinkedPhotos: unlinkedPhotos,
    entries: dayEntries};
}



function getDateParams(params) {
  let d = {}, has = false;
  if (!params) return null; 
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
    return await Entry.aggregate([{ $match: search }, { $sample: { size: parseInt(params.count || params.limit || '10') } }]).then(annotateEntries);
  } else {
    entries = Entry.find(search).sort(sort);
  }
  if (params.limit) { entries = entries.limit(parseInt(params.limit)); }
  return entries.exec().then(annotateEntries);
}
module.exports.getEntries = getEntries;

async function fixEntryPictureList(entry) {
  if (entry.Pictures) {
    console.log('val', entry.Pictures.split(/,/));
    entry.PictureList = entry.Pictures.split(/,/);
    await entry.save();
    console.log(entry.PictureList);
  }
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
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


async function entriesAsCSV(params) {
  return fastCsv.writeToString(await getEntries(params), {columns: columns, transform: csvTransformer, headers: columns, writeHeaders: true});
}
module.exports.entriesAsCSV = entriesAsCSV;

async function getRandom(params) {
  return await Entry.aggregate([{ $match: { Status: {$ne: 'Deleted'} } }, { $sample: { size: params.count || params.limit || 10 } }]).exec();
}
module.exports.getRandom = getRandom;

async function getUncategorized(query) {
  var count = query.count || query.limit || 50;
  var entries = Entry.find({Category: null, Status: {$ne: 'Deleted'}}).sort({Date: -1}).limit(parseInt(count)).exec();
  return entries;
}
module.exports.getUncategorized = getUncategorized;

async function getIncomplete(query) {
  var count = query.count || query.limit || 50;
  var entries = await Entry.find({Category: {$nin: ['Consulting', 'Track', 'Oops']},
                                  Status: {$ne: 'Deleted'},
                                  Level: {$gt: 1},
                                  Note: {$regex: /^[a-z].*[^\.!)"][ \t\r\n]*$/}})
      .sort({Date: -1}).limit(parseInt(count)).exec();
  return entries;
}
module.exports.getIncomplete = getIncomplete;

function getEntryByZID(zidString) {
  return Entry.findOne({ZIDString: zidString, Status: {$ne: 'Deleted'}}).exec();
}
module.exports.getEntryByZID = getEntryByZID;

function getEntryByID(id) {
  return Entry.findOne({ID: id}).exec();
}
module.exports.getEntryByID = getEntryByID;

async function createPictureRecord(filename) {
  let p = await preparePictureRecord(filename);
  return p && p.save();
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
  let files = await fs.readdir(process.env.THUMBNAILS_DIR);
  let list = (await Picture.find().exec()).map(f => f.filename);
  let newImages = files.filter(f => !list.includes(f) && !f.match(/.xmp$/));
  console.log('Creating picture records', newImages);
  await Promise.all(newImages.map(createPictureRecord));
  console.log('Done.');
}
module.exports.updatePictureRecords = updatePictureRecords;

async function makeThumbnail(o) {
  return fs.access(process.env.THUMBNAILS_DIR + path.basename(o))
    .then(function() { })
    .catch(async function(err) {
      if (!o.match(/\.jpg$/)) return null;
      console.log('Resizing ' + o);
      let orig = await findOriginalPicture(o);
      if (orig) {
        return sharp(orig, { failOnError: false })
          .resize(THUMBNAIL_WIDTH)
          .toFile(process.env.THUMBNAILS_DIR + path.basename(o))
          .then(() => {
            return path.basename(o);
          }).catch((e) => {
            return null;
          });
      }
    });
}

async function makeThumbnails() {
  let list = [];
  imageDirs.forEach((dir) => {
    fs.readdir(dir).then((files) =>  {
      list = list.append(files.map(makeThumbnail));    
    });
  });
  await Promise.all(list);
  return list.map((p) => { return p.value; }).filter(p => p);
}
module.exports.makeThumbnails = makeThumbnails;

function getBackwardLinks(entry) {
  if (!entry) { return []; }
  return getEntries({q: 'ref:' + entry.ZIDString, regex: true});
}
module.exports.getBackwardLinks = getBackwardLinks;

function getForwardLinks(entry) {
  if (!entry) { return []; }
  if (!entry.Other) { return []; }
  let m = entry.Other.match(/(?<=^|[ \t\r\n])ref:[0-9]+[0-9]+[0-9]+[0-9]+-[0-9]+[0-9]+-[0-9]+[0-9]+-[0-9]+[0-9]+(?=$|[ \t\r\n])/g);
  if (!m) return [];
  let re = m.map((o) => o.replace('ref:', '')).join('|');
  return getEntries({zidre: re});
}
module.exports.getForwardLinks = getForwardLinks;

async function updateEntry(entry, attributes) {
  let e = {...entry.toObject(), ...attributes};
  let oldDate = moment(e.Date).format('YYYY-MM-DD');
  if (e.PictureList) {
    e.PictureList = [...new Set(e.PictureList)];
    await Promise.all(e.PictureList.map(createPictureRecord));
  }
  else if (e.Pictures) {
    e.PictureList = [...new Set(e.Pictures.split(/,/))];
    // Make thumbnails if they don't exist
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
  
  for (const [key, value] of Object.entries(e)) {
    entry[key] = value;
  }
  return entry.save();
}
module.exports.updateEntry = updateEntry;

async function deleteEntry(e) {
  if (!e) return null;
  e.Status = 'Deleted';
  return e.save();
}
module.exports.deleteEntry = deleteEntry;

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
module.exports.linkPictures = linkPictures;

async function linkEntry(entry, toEntry, note) {
  if (toEntry instanceof Entry) {
    toEntry = toEntry.ZIDString;
  }
  if (!(entry.Other || '').match('ref:' + toEntry)) {
    entry.Other = (entry.Other ? entry.Other + "\n" : '') + "ref:" + toEntry + (note ? ' ' + note : '');
    return entry.save();
  } else {
    return entry;
  }
}
module.exports.linkEntry = linkEntry;

async function tagEntriesByZids(zids, tags, note) {
  return zids.reduce(async (prev, zid) => {
    return prev.then(async (_) => {
      let entry = await getEntryByZID(zid);
      entry = tagEntry(entry, tags, note);
      return _.concat(entry);
    });
  }, Promise.resolve([]));
}
module.exports.tagEntriesByZids = tagEntriesByZids;

async function linkEntriesByZids(zids, tags, note) {
  zids = zids.sort().reverse();
  let fromEntry = await getEntryByZID(zids[0]);
  let list = [];
  for (let i = 1; i < zids.length; i++) {
    let toEntry = await getEntryByZID(zids[i]);
    if (toEntry) {
      let result = await linkEntry(fromEntry, toEntry, note);
      list.push(result);
      fromEntry = toEntry;
    }
  }
  return list;
}
module.exports.linkEntriesByZids = linkEntriesByZids;

async function tagEntry(entry, tags, note) {
  entry.Other = entry.Other || '';
  tags = (Array.isArray(tags)) ? tags : [tags];
  tags = tags.filter((tag) => !entry.Other.match('#' + tag));
  if (tags.length > 0) {
    entry.Other = entry.Other + "\n" + tags.map((tag) => '#' + tag + (note ? ' ' + note : '')).join("\n");
    return entry.save();
  } else {
    return entry;
  }
}
module.exports.tagEntry = tagEntry;

async function deleteEntryPictures(e, list) {
  if (Array.isArray(list)) { 
    e.PictureList = e.PictureList.filter((f) => !list.includes(f));
  } else {
    e.PictureList = e.PictureList.filter((f) => { return f != list; });
  }
  e.Pictures = e.PictureList.join(',');
  if (e.Status != 'New') { e.Status = 'Updated'; }
  return e.save();
}

async function createEntry(e) {
  if (e.Date) {
    if (e.Time) {
      e.Date = moment(moment(e.Date).format('YYYY-MM-DD') + ' ' + e.Time).toDate();
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
module.exports.createEntry = createEntry;

async function getPhotosFromDir(dir) {
  var list = await fs.readdir(dir);
  var deleted = (await Picture.find({status: 'Deleted'}).exec()).map(d => d.Filename);
  return list.filter(d => !deleted.includes(d));
}

async function countEntries() {
  return Entry.find({status: {$ne: 'Deleted'}}).countDocuments().exec();
}

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
}

function connect() {
  return mongoose
    .connect(process.env.MONGODB, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true });
}
module.exports.connect = connect;
