import React from 'react';
import './EntryWall.css';
import EntryItem from './EntryItem';

export default function EntryList(data) {
    return <ul>
             {data.entries.map((entry) => {
               return <li key={entry.ZIDString}><EntryItem entry={entry} onClick={data.onClick} linkDate="true" selected={data.selected}/></li>;
             })}
           </ul>;
};
