import React, { useState, useEffect } from 'react';
import EntryWall from '../components/EntryWall';
export default function Random() {
    const [data, setData] = useState([]);
    useEffect(() => {
        fetch('/api/entries?withPhotos=1&limit=20')
            .then(res => res.json())
            .then(entries => { setData(entries); });
    }, []);
  return <EntryWall entries={data} includeDate={true}/>;
}

