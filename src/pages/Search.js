import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import { objToQueryString } from '../App';
import Checkbox from '@material-ui/core/Checkbox';
import EntriesView from '../components/EntriesView';
import BulkOperations, { SelectedInfo } from '../components/BulkOperations';
import useSelectEntries from '../hooks/useSelectEntries';


// const keyMap = {
//     PREVIOUS: "left",
//     NEXT: "right"
// };

// https://stackoverflow.com/questions/37230555/get-with-query-string-with-fetch-in-react-native
const queryString = require('query-string');
export default function Search(props) {
  const [ message, setMessage ] = useState('');
  const parsed = queryString.parse(props.location && props.location.search);
  const [ query, setQuery ] = useState(parsed.q);
  const [ limit, setLimit ] = useState(100);
  const [ entries, setEntries ] = useState([]);
  const [ withPhotos, setWithPhotos ] = useState(false);
  const [ isRegexp, setIsRegexp ] = useState(false);
  const [ sort, setSort ] = useState('date');
  const handleChange = event => {
    if (event.target.name === 'query') { setQuery(event.target.value); }
    if (event.target.name === 'limit') { setLimit(event.target.value); }
    if (event.target.name === 'sort') { setSort(event.target.value); }
    if (event.target.name === 'isRegexp') { setIsRegexp(event.target.checked); }
    if (event.target.name === 'withPhotos') { setWithPhotos(event.target.checked); }
  };
  const { selectedEntries, clickEntry, clearSelection, selectAll } = useSelectEntries({entries});
  const bulkDone = () => { getData(); };
  const getData = (event) => {
    if (event) { event.preventDefault(); }
    if (!query) return null;
    let params = {q: query, limit: limit, sort: sort, withPhotos: withPhotos ? 1 : 0, regex: isRegexp ? 1 : 0 };
    setMessage('Fetching...');
    fetch('/api/entries?' + objToQueryString(params)).then(res => res.json())
      .then(data => { setEntries(data); setMessage(''); } );
    return false;
  };
  return (
    <div>
      <form onSubmit={getData}>
        <TextField label="Search" value={query} onChange={handleChange} name="query" onBlur={getData} autoFocus />
        <TextField label="Limit" value={limit} onChange={handleChange} name="limit" />
        <RadioGroup aria-label="sort" name="sort" value={sort} onChange={handleChange}>
          <FormControlLabel value="date" control={<Radio />} label="By date" />
          <FormControlLabel value="score" control={<Radio />} label="By score" />
        </RadioGroup>
        <FormControlLabel control={<Checkbox value={isRegexp} onChange={handleChange} name="isRegexp"/>} label="Regexp" />
        <FormControlLabel control={<Checkbox value={withPhotos} onChange={handleChange} name="withPhotos" />} label="Only with photos" />
        <IconButton type="submit"><SearchIcon/></IconButton> {message}
      </form>
      <div style={{position: 'sticky', top: 0, background: '#303030'}}>
        <BulkOperations entries={entries} selected={selectedEntries} onDone={bulkDone} onClear={clearSelection} onSelectAll={selectAll}/>
      </div>
      <EntriesView entries={entries} onClick={clickEntry} selected={selectedEntries} view="list"/>
      <BulkOperations entries={entries} selected={selectedEntries} onDone={bulkDone} onClear={clearSelection} onSelectAll={selectAll}/>
      <SelectedInfo entries={entries} selected={selectedEntries} />
    </div>
  );
}

