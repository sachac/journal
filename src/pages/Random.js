import React, { useState, useEffect } from 'react';
import EntryWall from '../components/EntryWall';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';

import Checkbox from '@material-ui/core/Checkbox';

export default function Random() {
    const [ withPhotos, setWithPhotos ] = useState(false);
    const [data, setData] = useState([]);
    const handleChange = event => {
        if (event.target.name === 'withPhotos') { setWithPhotos(event.target.checked); }
    };
    const getData = () => {
        fetch('/api/entries?random=1&withPhotos=' + withPhotos)
            .then(res => res.json())
            .then(entries => { setData(entries); });
    };
    useEffect(getData, [withPhotos]);
    return (<div>
              <Button onClick={getData}>Reload</Button>
              <FormControlLabel control={<Checkbox value={withPhotos} onChange={handleChange} name="withPhotos" />} label="Only with photos" />
              <EntryWall entries={data} includeDate={true}/>
              <Button onClick={getData}>Reload</Button>
            </div>);
}

