import React, { useState, useEffect } from 'react';
import { addMonths } from 'date-fns';
// import { HotKeys } from "react-hotkeys";
import Button from '@material-ui/core/Button';
import PhotoList from '../components/PhotoList';
import history from "../history";
import { DatePicker } from '@material-ui/pickers';
import BulkOperations, { SelectedInfo } from '../components/BulkOperations';
import EntriesView from '../components/EntriesView';
import { Link, useParams } from "react-router-dom";
import moment from 'moment';
import useSelectEntries from '../hooks/useSelectEntries';

// const keyMap = {
//     PREVIOUS: "left",
//     NEXT: "right"
// };

export default function MonthView() {
  const { dateParam } = useParams();
  const [ entries, setEntries ] = useState([]);
  const [ date, setDate ] = useState(dateParam ? new Date(dateParam + '-15') : new Date());
  const { selectedEntries, clickEntry, clearSelection, selectAll } = useSelectEntries({entries});
  const [ unlinkedPhotos, setUnlinkedPhotos ] = useState([]);
  const previousMonth = () => { setDate(addMonths(date, -1)); };
  const nextMonth = () => { setDate(addMonths(date, 1)); };
  const onChange = date => { setDate(date); };
  useEffect(() => { history.push('/month/' + moment(date).format('YYYY-MM')); }, [date]);
  
  // clickPhoto = (event) => {
  //     var f = event.target.getAttribute('data-filename');
  //     this.setState({selectedPhotos: this.state.selectedPhotos.push(f)});
  // };
  // clickEntry = (event) => {
  //     var id = event.target.getAttribute('data-id');
  //     if (this.state.selectedPhotos.length > 0) {
  //         console.log('Trying to link', id, this.state.selectedPhotos);
  //         fetch('/api/entries/' + id + '/pictures', {
  //             method: 'POST',
  //             headers: {'Content-Type': 'application/json' },
  //             body: JSON.stringify({filenames: this.state.selectedPhotos})
  //         }).then(() => {
  //             this.setState({selectedPhotos: []});
  //             this.getData();
  //         });
  //     }
  // }

  const [ sort, setSort ] = useState('category');
  const toggleSort = (e, p) => {
    if (sort === 'category') {
      setSort('zid');
    } else {
      setSort('category');
    }
  };
    
  const getData = async() => {
    fetch('/api/date/' + moment(date).format('YYYY-MM'))
      .then(res => res.json())
      .then(data => { setEntries(data.entries); setUnlinkedPhotos(data.unlinkedPhotos); });
    return null;
  };
  const bulkDone = () => { getData(); };
  useEffect(() => { getData(); }, [date]);
  return (
    <div>
      <Button color="inherit" component={Link} to="/day">View by day</Button>
      <Button onClick={toggleSort}>Toggle sort</Button>
      <div>
        <Button onClick={previousMonth}>&laquo;</Button>
        <DatePicker value={date} onChange={onChange} format="yyyy-MM"/>
        <Button onClick={nextMonth}>&raquo;</Button>
      </div>
      <div style={{position: 'relative'}}>
        <div style={{position: 'sticky', top: 0, background: '#303030'}}>
          <BulkOperations entries={entries} selected={selectedEntries} onDone={bulkDone} onClear={clearSelection} onSelectAll={selectAll}  />
        </div>
        <EntriesView entries={entries} includeDate={true} onClick={clickEntry} selected={selectedEntries} />
      </div>
      <PhotoList data={unlinkedPhotos} />
      <SelectedInfo entries={entries} selected={selectedEntries} />
    </div>
  );
}
