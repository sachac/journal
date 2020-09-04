const process = require('process');
const express = require('express');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env')});
const app = express();
const parse = require('csv-parse');
const bodyParser = require('body-parser');
const moment = require('moment');
const dataLib = require('./data');

// Serve the static files from the React app
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../build')));

app.use('/thumbnails', express.static(process.env.THUMBNAILS_DIR));
dataLib.imageDirs.forEach((dir) => app.use('/thumbnails', express.static(dir)));
app.get('/thumbnails/:filename', async(req, res) => {
  let f = await dataLib.findOriginalPicture(req.params.filename);
  if (f) {
    res.sendFile(f);
  } else {
    res.send(404);
  }
});

const entriesMatchingDate = (date) => { return (d) => { return d.Date.replace(/-/g, '').match(date); }; };

app.delete('/api/pictures/:filename', async (req, res) => {
  let result = await dataLib.deletePicture(req.params.filename);
  res.sendStatus(result ? 200 : 404);
});

app.post('/api/updateZIDs', async (req, res) => {
  await dataLib.updateZIDs(req.body.count || 100);
  res.send(200);
});

app.get('/api/onthisday/:date', async (req, res) => { res.json(await dataLib.getOnThisDayData(req.params.date)); });
app.get('/api/date/:date', async (req, res) => { res.json(await dataLib.getDateData(req.params)); });
app.get('/api/photos', async (req, res) => { res.json(await dataLib.getPhotos(req.query)); });
app.get('/api/entries', async (req, res) => { res.json(await dataLib.getEntries(req.query)); });
app.get('/api/entries.csv', async (req, res) => { res.send(await dataLib.entriesAsCSV(req.query)); });
app.get('/api/entries/random', async (req, res) => { res.json(await dataLib.getRandom(req.query)); });
app.get('/api/entries/uncategorized', async (req, res) => { res.json(await dataLib.getUncategorized(req.query)); });
app.get('/api/entries/incomplete', async (req, res) => { res.json(await dataLib.getIncomplete(req.query)); });
app.get('/api/entries/zid/:zidString/links', async (req, res) => {
  dataLib.getEntryByZID(req.params.zidString).then(dataLib.getForwardLinks).then((data) => { res.json(data); });
});

app.get('/api/entries/zid/:zidString/backlinks', async (req, res) => {
  dataLib.getEntryByZID(req.params.zidString).then(dataLib.getBackwardLinks).then((data) => { res.json(data); });
});

app.get('/api/entries/zid/:zidString', async (req, res) => {
  dataLib.getEntryByZID(req.params.zidString).then(function(entry) {
    if (entry) {
      res.json(entry);
    } else {
      res.sendStatus(404);
    }
  });
});

app.get('/api/entries/:id', async (req, res) => {
  if (req.params.id.match(/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-[0-9][0-9]$/)) {
    res.json(await dataLib.getEntryByZID(req.params.id));
  } else {
    res.json(await dataLib.getEntryByID(req.params.id));
  }
});

app.get('/api/makeThumbs', async (req, res) => {
  var list = await dataLib.makeThumbnails();
  await dataLib.updatePictureRecords();
  res.json(list);
});

app.post('/api/makeThumbs', async (req, res) => {
  var list = await dataLib.makeThumbnails();
  await dataLib.updatePictureRecords();
  res.json(list);
});

app.put('/api/entries/:id', async (req, res) => {
  var e = await dataLib.getEntryByID(req.body.ID || req.params.id);
  let result = await dataLib.updateEntry(e, req.body);
  console.log(result, req.body, req.body.ID);
  if (!e) { res.sendStatus(404); }
  else { res.json(result); }
});

app.delete('/api/entries/:id', async (req, res) => {
  let result = await dataLib.deleteEntry(await dataLib.getEntryByID(req.params.id));
  res.sendStatus(result ? 200 : 404);
});

app.post('/api/entries/zid/:zid/links/:toZID', async (req, res) => {
  let entry = await dataLib.getEntryByZID(req.params.zid);
  if (entry) {
    let result = await dataLib.linkEntry(entry, req.params.toZID);
    if (result) { res.json(result); }
    else { res.send(500); }
  } else {
    res.sendStatus(404);
  }
});
app.post('/api/entries/zid/:zid/tags/:tag', async (req, res) => {
  let entry = await dataLib.getEntryByZID(req.params.zid);
  if (entry) {
    let result = await dataLib.tagEntry(entry, req.params.tag, req.body.note);
    if (result) { res.json(result); }
    else { res.send(500); }
  } else {
    res.sendStatus(404);
  }
});
app.post('/api/entries/tag/bulk', async (req, res) => {
  let zids = req.body.zids;
  let tags = req.body.tags;
  let note = req.body.note;
  if (!zids || !tags) { res.send(500); return null; }
  return dataLib.tagEntriesByZids(zids, tags, note).then(res.json);
});

app.post('/api/entries/link/bulk', async (req, res) => {
  let zids = req.body.zids;
  let note = req.body.note;
  if (!zids) { res.send(500); return null; }
  return dataLib.linkEntriesByZids(zids, note).then(res.json);
});

app.post('/api/entries/zid/:zid/links', async (req, res) => {
  let result = await dataLib.linkEntry(await dataLib.getEntryByZID(req.params.zid), req.body.ZIDString, req.body.note);
  if (result) { res.json(result); }
  else { res.send(500); }
});

app.post('/api/entries/:id/pictures', async (req, res) => {
  let result = await dataLib.linkPictures(req.params.id, req.body.filename ? [req.body.filename] : req.body.filenames);
  if (result) { res.json(result); }
  else { res.send(404); }
});
app.delete('/api/entries/:id/pictures', async (req, res) => {
  let e = await Entry.findOne({ID: req.params.id}).exec();
  if (!e) { res.send(404); }
  if (req.body.filenames) { await dataLib.deleteEntryPictures(e, req.body.filenames); }
  if (req.body.filename) { await dataLib.deleteEntryPictures(e, req.body.filename); }
  res.send(e);
});

app.post('/api/entries', async (req, res) => { res.send(await dataLib.createEntry(req.body)); });
app.get('/api/date/:date/entries', async (req, res) => { res.json(await dataLib.getEntries(req.params)); });

app.post('/api/importIntoDB', async (req, res) => {
  await dataLib.importEntriesIntoDB(await dataLib.readEntriesFromFile(process.env.JOURNAL_FILE));
  res.json({count: await dataLib.countEntries()});
});

app.post('/api/export', async (req, res) => { await dataLib.writeCSV(); res.sendStatus(200); });

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

const port = process.env.PORT || 5001;
async function run() {
  app.listen(port);
  console.log('App is listening on port ' + port);
}

dataLib.connect()
  .then(() => { console.log('MongoDB Connected'); run(); })
  .catch(err => console.log(err));

