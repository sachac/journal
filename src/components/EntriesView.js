import React, {useState} from 'react';
import EntryWall from './EntryWall';
import EntryTree from './EntryTree';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

export default function EntriesView(data) {
    let entries;

    const [ view, setView ] = useState('tree');
    const handleChange = (e, newValue) => {
        setView(newValue);
    };
    if (view === 'cards') {
        entries = <EntryWall entries={data.entries} onEntryLink={data.onEntryLink} includeDate={true}/>;
    } else if (view === 'tree') {
        entries = <EntryTree entries={data.entries} onEntryLink={data.onEntryLink} sort="category" />;
    } else {
        entries = <EntryTree entries={data.entries} onEntryLink={data.onEntryLink} sort="date" />;   
    }
    return (<div>
              <Tabs value={view} onChange={handleChange} aria-label="view type" >
                <Tab value="tree" label="Tree"/>
                <Tab value="list" label="List"/>
                <Tab value="cards" label="Cards"/>
              </Tabs>
              {entries}
            </div>);
}
