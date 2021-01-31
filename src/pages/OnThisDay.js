import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { DayEntriesView } from '../pages/DayView';
import DateSelector from '../components/DateSelector';
import moment from 'moment';
import history from "../history";

export default function OnThisDay() {
  const { dateParam } = useParams();
  const [date, setDate] = useState(dateParam ? moment(dateParam).toDate() : new Date());
  const [data, setData] = useState({});
  const onChange = date => {
    setDate(date);
    history.push('/onThisDay/' + moment(date).format('YYYY-MM-DD'));
  };
  
  const getData = () => {
    fetch('/api/onThisDay/' + moment(date).format('MM-DD'))
      .then(res => res.json())
      .then(setData);
    return null;
  };
  useEffect(() => { getData(); }, [date]);

  return (
    <div>
      <DateSelector value={date} format="MM-dd" onChange={onChange} />
      <DayEntriesView date={date} data={data} getData={getData} />
    </div>
  );        
}

