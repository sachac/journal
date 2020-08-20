import React, { useState, useEffect } from 'react';
import EntryForm from '../components/EntryForm';


export default function Incomplete() {
    const [data, setData] = useState();
    const getEntry = () => {
        fetch('/api/entries/incomplete?limit=1')
            .then(res => res.json())
            .then(entries => { setData(entries[0]); });
    };
    useEffect(getEntry, []);
  return data ? <EntryForm entry={data} onSubmit={getEntry} /> : <div>All good!</div>;
}

