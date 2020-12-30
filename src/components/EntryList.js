import React from 'react';
import './EntryWall.css';
import EntryItem from './EntryItem';
import PropTypes from 'prop-types';

export default function EntryList(data) {
  console.log('sorting');
    return <ul>
             {data.entries.sort((a, b) => { return a.ZIDString > b.ZIDString ? -1 : 1; }).map((entry) => {
               return <li key={entry.ZIDString}><EntryItem entry={entry} linkDate="true" {...data}/></li>;
             })}
           </ul>;
}
EntryList.propTypes = {
    entries: PropTypes.array.required
};
