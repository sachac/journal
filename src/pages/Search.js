import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';

import Checkbox from '@material-ui/core/Checkbox';
import EntriesView from '../components/EntriesView';


// const keyMap = {
//     PREVIOUS: "left",
//     NEXT: "right"
// };

// https://stackoverflow.com/questions/37230555/get-with-query-string-with-fetch-in-react-native
function objToQueryString(obj) {
  const keyValuePairs = [];
  for (let i = 0; i < Object.keys(obj).length; i += 1) {
    keyValuePairs.push(`${encodeURIComponent(Object.keys(obj)[i])}=${encodeURIComponent(Object.values(obj)[i])}`);
  }
  return keyValuePairs.join('&');
}
export default function Search() {
    const [ message, setMessage ] = useState('');
    const [ query, setQuery ] = useState('');
    const [ limit, setLimit ] = useState(50);
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
    const getData = (event) => {
        event.preventDefault();
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
            <TextField label="Search" value={query} onChange={handleChange} name="query" autoFocus />
            <TextField label="Limit" value={limit} onChange={handleChange} name="limit" />
            <RadioGroup aria-label="sort" name="sort" value={sort} onChange={handleChange}>
              <FormControlLabel value="date" control={<Radio />} label="By date" />
              <FormControlLabel value="score" control={<Radio />} label="By score" />
            </RadioGroup>
            <FormControlLabel control={<Checkbox value={isRegexp} onChange={handleChange} name="isRegexp"/>} label="Regexp" />
            <FormControlLabel control={<Checkbox value={withPhotos} onChange={handleChange} name="withPhotos" />} label="Only with photos" />
            <IconButton type="submit"><SearchIcon/></IconButton> {message}
          </form>
          <EntriesView entries={entries}/>
          
        </div>
    );
}
