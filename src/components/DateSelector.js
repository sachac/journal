import { addDays, addYears } from 'date-fns';
import React from 'react';
import { DatePicker } from '@material-ui/pickers';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from "react-router-dom";
import moment from 'moment';

const useStyles = makeStyles({
  date: { width: '120px', fontSize: 'small' }
});
export default function DateSelector(data) {
    const classes = useStyles();
    const previousDay = () => { data.onChange(addDays(data.value, -1)); };
    const nextDay = () => { data.onChange(addDays(data.value, 1)); };
    const previousYear = () => { data.onChange(addYears(data.value, -1)); };
    const nextYear = () => { data.onChange(addYears(data.value, 1)); };
    return (<div className="dateSelector">
              <Button onClick={previousYear}>&laquo;</Button>
              <Button onClick={previousDay}>&lt;</Button>
              <DatePicker value={data.value} format="yyyy-MM-dd" onChange={data.onChange} className={classes.date}/>
              <Button onClick={nextDay}>&gt;</Button>
              <Button onClick={nextYear}>&raquo;</Button>
              <Button component={Link} to={'/day/' + moment(data.value).format('YYYY-MM-DD')}>Go</Button>
          </div>);
}

