import React, { Component, useEffect } from 'react';
import ReactTooltip from 'react-tooltip';
import { Link } from 'react-router-dom';
import { debounce } from 'throttle-debounce';
import CalendarHeatmap from 'react-calendar-heatmap';
import { HotKeys } from "react-hotkeys";
import 'react-calendar-heatmap/dist/styles.css';
import Calendar from 'react-calendar';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays } from 'date-fns';

const _ = require('lodash');

const keyMap = {
    PREVIOUS: "left",
    NEXT: "right"
};
    
class DayView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            date: new Date(2019, 11, 4),
            data: {},
            selectedPhotos: []
        };
    }
    previousDay = () => {
        this.setState({ date: addDays(this.state.date, -1) }, this.getData);
    }
    nextDay = () => {
        this.setState({ date: addDays(this.state.date, 1) }, this.getData); 
    };
    keyHandlers = {
        NEXT: event => { this.nextDay(); },
        PREVIOUS: event => { this.previousDay(); },
    };
    onChange = date => {
        this.setState({ date }, () => { this.getData(); });
    };
    clickPhoto = (event) => {
        var f = event.target.getAttribute('data-filename');
        this.setState({selectedPhotos: this.state.selectedPhotos.push(f)});
    };
    clickEntry = (event) => {
        var id = event.target.getAttribute('data-id');
        if (this.state.selectedPhotos.length > 0) {
            console.log('Trying to link', id, this.state.selectedPhotos);
            fetch('/api/entries/' + id + '/pictures', {
                method: 'POST',
                headers: {'Content-Type': 'application/json' },
                body: JSON.stringify({filenames: this.state.selectedPhotos})
            }).then(() => {
                this.setState({selectedPhotos: []});
                this.getData();
            });
        }
    }

    getData() {
        fetch('/api/date/' + this.state.date.toISOString().substring(0, 10))
            .then(res => res.json())
            .then(data => this.setState({ data }));
    }
    componentDidMount() {
        this.getData();
    }
    render() {
        const { data } = this.state; 
        return (
                <HotKeys handlers={this.keyHandlers} keyMap={keyMap}>
                <div>
                <button onClick={this.previousDay}>&laquo;</button>
                <DatePicker
            selected={this.state.date}
            onChange={this.onChange}
                />
                <button onClick={this.nextDay}>&raquo;</button>
                </div>
                <div className="unlinkedPhotos">
                {data && data.unlinkedPhotos && data.unlinkedPhotos.map((p) => {
                    return (
                            <img key={p} alt={p} className={(this.state.selectedPhoto == p) ? 'selected' : ''} onClick={this.clickPhoto} data-filename={p} src={'thumbnails/' + p} />
                    )
                    })}
            </div>
                <table className="dateEntries">
                <tbody>
                {data && data.entries && data.entries.map((d) => {
                    return (
                            <tr key={d.ID}><td>{(d.PictureList || []).map((p) => {
                            return (
                                    <img key={p} alt={p} src={'thumbnails/' + p} width="100" />
                            )
                        })}</td>
                            <td>
                            <div data-id={d.ID} onClick={this.clickEntry}>{d.Note}</div>
                        </td>
                        </tr>
                    )
                })}
            </tbody></table>
                
                </HotKeys>
        );
    }
}

class EntryList extends Component {
  constructor(props) { super(props); }
  render() {
    return this.props.list.map((entry) => {
      return (
          <div>
          {entry.Note} ({entry.Date}, {entry.Category})
        </div>
      );
    });
  }
}

class DiaryView extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    var grouped = _.entries(_.groupBy(this.props.list, (o) => { return o.Date.substring(0, 7); }));
    return (
        <div>
        {grouped.map((month) => {
          return (
            <div>
              <h1>{month[0]}</h1>
              <EntryList list={month[1]} />
            </div>
          )})
        }
        </div>
    );
  }
}

class CategoryView extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    var grouped = _.entries(_.groupBy(this.props.list, (o) => { return o.Category }));
    return (
        <div>
        {grouped.map((group) => {
          return (
            <div>
              <h1>{group[0]}</h1>
              <EntryList list={group[1]} />
            </div>
          )})
        }
        </div>
    );
  }
}


class TableView extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const list = this.props.list;
    return (
      <table><tbody>
      {list.map((o) => {
        return(
            <tr key={o.ID}><td width="100">{o.Date}</td>
            <td>{o.Note}</td>
            <td width="200">{o.Category}</td>
            </tr>
        );
      })}
      </tbody>
        </table>
    );
  }
}

class CalendarMaps extends Component {
  constructor(props) { super(props); }
  render() {
    return (
        <table width="100%"><tbody><tr><td>
                2018<br />
                <CalendarHeatmap startDate={new Date(2018, 0, 1)}
            endDate={new Date(2019, 0, 1)}
            onClick={this.showEntriesForDate}
            onMouseOver={this.calendarMouseOverDebounced}
            onMouseLeave={this.calendarMouseOverDebounced}
            values={this.props.dates} /></td><td>
                2019<br />
                <CalendarHeatmap startDate={new Date(2019, 0, 1)}
            endDate={new Date(2020, 0, 1)}
            onClick={this.showEntriesForDate}
            onMouseOver={this.calendarMouseOverDebounced}
            onMouseLeave={this.calendarMouseOverDebounced}
      values={this.props.dates} /></td></tr></tbody></table>
    );
  }
}

class Journal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            list: [],
            date: null,
            filtered: [],
            clicked: false,
            filterText: ''
        }
        this.updateFilter = this.updateFilter.bind(this);
        this.showEntriesForDate = this.showEntriesForDate.bind(this);
        this.filterEntriesDebounced = debounce(500, this.filterEntries);
        this.calendarMouseOverDebounced = debounce(500, (event, o) => { return this.showEntriesForDate(o); });
    }

    componentDidMount() {
        this.getList();
    }

    getList = () => {
        fetch('/api/entries')
            .then(res => res.json())
            .then(list => { this.setState({ list, filtered: list }); })
    }

    filterEntries = () => {
        const text = this.state.filterText;
        const date = this.state.date;
        var list = this.state.list;
        if (text) {
            var filters = text.split(/ +/).map((o) => { return new RegExp(o, 'i') });
            list = list.filter((o) =>
                {
                    var text = (o.Note + ' ' + o.Category);
                    return filters.reduce((val, r) => {
                        return val && text.match(r);
                    }, true);
                })
        }
        this.setState({filtered: list});
    }

    calendarClick = (value) => {
        this.setState({clicked: true});
        this.showEntriesForDate(value);
    }
    
    showEntriesForDate = (value) => {
        if (value && value.date && this.state.date == value.date) {
            this.setState({date: null}, () => { this.filterEntries(); });
        } else {
            this.setState({date: value && value.date}, () => { this.filterEntries(); });
        }
    }

    async updateFilter(e) {
        this.setState({
            filterText: e.target.value,
        }, () => {
            this.filterEntriesDebounced();
        });
    }

    render() {
        var { list, filtered, date } = this.state;
        var entriesToShow = filtered;
        if (date) {
            entriesToShow = entriesToShow.filter((o) => { return (o.Date == date); });
        }

        // (value) => {
        //         if (!value || !value.date) return;
        //         var matching = filtered.filter((o) => {
        //             return o.Date == value.date }).map((o) => { return o.Note }).join('<br />');
        //     return { 'data-tip': `Date is ${value.date}<br />${matching}` } }
        var dateHash = {};
        filtered.map((o) => { dateHash[o.Date] = (dateHash[o.Date] || 0) + 1; });
        
        var dates = Object.keys(dateHash).map((o) => { return { date: o, count: dateHash[o] }});
        var years = [2019, 2018, 2017];
        
        return (
                <div className="journal">
            <input className="search" value={this.state.filterText} onChange={this.updateFilter} />
            {/*<CalendarMaps list={list} dates={dates} />*/}
            <CategoryView list={list} />
                
                 </div>
        )
    }
}


class Home extends Component {
  render() {
    return (
    <div className="App">
      <DayView />
      <ReactTooltip html={true} multiline={true}/>
    </div>
    );
  }
}
export default Home;
