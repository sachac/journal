import TextField from '@material-ui/core/TextField';
import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';

const categories = ['',
                    'Gross motor',
                    'Eating',
                    'Meta',
                    'Fine motor', 'Language', 'Kaizen', 'Us', 'Self-care and independence', 'Social', 'Other', 'Household', 'Field trip', 'Pretend', 'Music', 'Oops', 'Sensory', 'Cognition', 'Emotion', 'Consulting', 'Track', 'Art', 'World', 'Thoughts', 'Interests', 'Sleep'].sort();

export default function CategoryList(data) {
    return <TextField label="Category" select name='category' value={data.value} onChange={data.onChange} className={data.className}>
      {categories.map((c, key) => { return (
          <MenuItem value={c} key={key}>{c}</MenuItem>
      ); })}
           </TextField>;
};


