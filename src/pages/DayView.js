import React, { useState, useEffect } from 'react';
import history from "../history";
// import { HotKeys } from "react-hotkeys";
import Button from '@material-ui/core/Button';
import PhotoList from '../components/PhotoList';
import { QuickEntryForm } from '../components/EntryForm';
import DateSelector from '../components/DateSelector';
import EntriesView from '../components/EntriesView';
import { Link, useParams } from "react-router-dom";
import ButtonGroup from '@material-ui/core/ButtonGroup';
import moment from 'moment';
// const keyMap = {
//     PREVIOUS: "left",
//     NEXT: "right"
// };


export function DayEntriesView(props) {
  let date = props.date;
  const [ lastEntry, setLastEntry ] = useState();
  const [ selected, setSelected ] = useState([]);
  const handlePhotoClick = (e, p) => {
    setSelected((selected.includes(p)) ? selected.filter(d => d !== p) : selected.concat(p));
  };
  const handleEntryClick = (event, entry) => {
    if (selected.length > 0) {
      fetch('/api/entries/' + entry.ID + '/pictures', {
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify({filenames: selected})
      }).then(() => {
        setLastEntry(entry);
        setSelected([]);
        props.getData && props.getData();
      });
    }
  };
  
  const handlePhotoDelete = (e) => {
    if (selected.length === 0) return null;
    return Promise.all(selected.map((s) => {
      return fetch('/api/pictures/' + s, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json' }
      });
    })).then(() => {
      setSelected([]);
      props.getData && props.getData();
    });
  };
  const onQuickEntry = () => {
    setSelected([]);
    props.getData && props.getData();
  };
  const OtherActions = (data) => {
    if (selected.length === 0) return null;
    return <ButtonGroup>
                     <Button onClick={handlePhotoDelete}>Delete</Button>
                     <Button onClick={handleSameAsPrevious}>Same as previous</Button>
                     <Button to={'/new?date=' + moment(date).format('YYYY-MM-DD') + '&filename=' + selected} component={Link}>Add new entry</Button>
                     
                   </ButtonGroup>;
  };

  const handleSameAsPrevious = (e) => {
    handleEntryClick(null, lastEntry);
  };

  let zoomPhotos = <div/>;
  if (selected.length > 0) {
    zoomPhotos = <div className="large"><PhotoList onClick={handlePhotoClick} data={selected} selected={selected}/></div>;
  }

  return (
    <div className={selected.length > 0 ? 'hasSelected' : ''}>
      <PhotoList scroll onDelete={handlePhotoDelete} onClick={handlePhotoClick} data={props.data.unlinkedPhotos} selected={selected} />
      <OtherActions selected={selected}/>
      <EntriesView entries={props.data.entries} onClick={handleEntryClick} />
      <QuickEntryForm selected={selected} date={props.date} onSubmit={onQuickEntry} photos={selected} />
      {zoomPhotos}
    </div>
  );

}

export default function DayView() {
  const { dateParam } = useParams();
  const [ data, setData ] = useState({});
  const [ date, setDate ] = useState(dateParam ? moment(dateParam).toDate() : new Date());
  const onChange = date => {
    setDate(date);
    history.push('/day/' + moment(date).format('YYYY-MM-DD'));
  };
  useEffect(() => { getData(); }, [date]);
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

  const getData = async() => {
    return fetch('/api/date/' + moment(date).format('YYYY-MM-DD'))
      .then(res => res.json())
      .then(data => setData(data));
  };
  
  return (
    <div>
      <Button color="inherit" component={Link} to={'/month/' + moment(date).format('YYYY-MM')}>View by month</Button>
      <DateSelector value={date} onChange={onChange} />
      <DayEntriesView date={date} data={data} getData={getData} />
    </div>
  );
}
