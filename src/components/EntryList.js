import React from 'react';
import './EntryWall.css';
import EntryItem from './EntryItem';
import PropTypes from 'prop-types';

export default function EntryList(data) {
    return <ul>
             {data.entries.map((entry) => {
               return <li key={entry.ZIDString}><EntryItem entry={entry} linkDate="true" {...data}/></li>;
             })}
           </ul>;
}
EntryList.propTypes = {
    entries: PropTypes.array.required
};
