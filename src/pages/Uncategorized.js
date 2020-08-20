import React, { useState, useEffect } from 'react';
import EntryForm from '../components/EntryForm';


export default function Uncategorized() {
    const [data, setData] = useState({});
    const getUncategorizedEntry = () => {
        fetch('/api/entries/uncategorized?count=1')
            .then(res => res.json())
            .then(entries => { setData(entries[0]); });
    };
    useEffect(getUncategorizedEntry, []);
    return (
        <EntryForm id={data && data.ID} onSubmit={getUncategorizedEntry} />
    );
}

