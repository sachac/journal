import React, { useState, useEffect } from 'react';
import { addMonths } from 'date-fns';
// import { HotKeys } from "react-hotkeys";
import Button from '@material-ui/core/Button';
import PhotoList from '../components/PhotoList';
import history from "../history";
import { DatePicker } from '@material-ui/pickers';
import EntriesView from '../components/EntriesView';
import { Link, useParams } from "react-router-dom";
import moment from 'moment';

// const keyMap = {
//     PREVIOUS: "left",
//     NEXT: "right"
// };

export default function MonthView() {
  const { dateParam } = useParams();
  const [ data, setData ] = useState({});
  const [ date, setDate ] = useState(dateParam ? new Date(dateParam + '-15') : new Date());
  const [ selectedEntries, setSelectedEntries ] = useState([]);  
  const previousMonth = () => {
    setDate(addMonths(date, -1));
  };
  const nextMonth = () => {
    setData(addMonths(date, 1));
  };
  const onChange = date => {
    setDate(date);
  };
  useEffect(() => {
    history.push('/month/' + moment(date).format('YYYY-MM'));
  }, [date]);

  const clickEntry = (event, entry) => {
    let index = selectedEntries.indexOf(entry.ZIDString);
    if (index == -1) {
      selectedEntries.push(entry.ZIDString);
    } else {
      selectedEntries.splice(index, 1);
    }
    setSelectedEntries([...selectedEntries]);
  };
  
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
      .then(data => {
        data.entries = data.entries.sort((a, b) => a.Category < b.Category ? -1 : 1);
        setData(data);              
      });
    return null;
  };
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
      
      <EntriesView entries={data.entries} includeDate={true} onSubmit={getData} onClick={clickEntry} selected={selectedEntries} />
      <PhotoList data={data.unlinkedPhotos} />
    </div>
  );
}
