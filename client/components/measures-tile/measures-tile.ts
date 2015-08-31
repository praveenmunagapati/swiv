'use strict';

import { List, OrderedSet } from 'immutable';
import * as React from 'react/addons';
import * as numeral from 'numeral';
import { $, Expression, Executor, Dataset } from 'plywood';
import { PIN_TITLE_HEIGHT, SEARCH_BOX_HEIGHT, PIN_ITEM_HEIGHT, PIN_PADDING_BOTTOM } from '../../config/constants';
import { hasOwnProperty } from '../../utils/general';
import { Clicker, Essence, DataSource, Filter, Dimension, Measure } from '../../models/index';
import { TileHeader } from '../tile-header/tile-header';
import { Checkbox } from '../checkbox/checkbox';

interface MeasuresTileProps {
  clicker: Clicker;
  essence: Essence;
  selectedMeasures: OrderedSet<string>;
}

interface MeasuresTileState {
  dataset?: Dataset;
  showSearch?: boolean;
}

export class MeasuresTile extends React.Component<MeasuresTileProps, MeasuresTileState> {
  public mounted: boolean;

  constructor() {
    super();
    this.state = {
      dataset: null,
      showSearch: false
    };
  }

  fetchData(essence: Essence): void {
    var { dataSource } = essence;
    var measures = dataSource.measures;

    var $main = $('main');

    var query: any = $()
      .apply('main', $main.filter(essence.getFilterHighlightExpression()));

    measures.forEach((measure) => {
      query = query.apply(measure.name, measure.expression);
    });

    dataSource.executor(query).then((dataset) => {
      if (!this.mounted) return;
      this.setState({ dataset });
    });
  }

  componentDidMount() {
    this.mounted = true;
    var { essence } = this.props;
    this.fetchData(essence);
  }

  componentWillReceiveProps(nextProps: MeasuresTileProps) {
    var { essence } = this.props;
    var nextEssence = nextProps.essence;
    if (essence.differentOn(nextEssence, 'filter', 'highlight')) {
      this.fetchData(nextEssence);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  toggleSearch() {
    var { showSearch } = this.state;
    this.setState({ showSearch: !showSearch });
  }

  render() {
    var { clicker, essence } = this.props;
    var { dataset, showSearch } = this.state;
    var { dataSource, selectedMeasures } = essence;

    var myDatum = dataset ? dataset.data[0] : null;

    var maxHeight = PIN_TITLE_HEIGHT;

    var rows = dataSource.measures.map(measure => {
      var measureName = measure.name;
      var selected = selectedMeasures.has(measureName);

      var measureValueStr = '-';
      if (myDatum && hasOwnProperty(myDatum, measureName)) {
        measureValueStr = numeral(myDatum[measureName]).format(measure.format);
      }

      return JSX(`
        <div className={'row' + (selected ? ' selected' : '')} key={measureName}>
          <div className="measure-name" onClick={clicker.toggleMeasure.bind(clicker, measure)}>
            <Checkbox checked={selected}/>
            <div className="label">{measure.title}</div>
          </div>
          <div className="measure-value">{measureValueStr}</div>
        </div>
      `);
    });
    maxHeight += rows.size * PIN_ITEM_HEIGHT + PIN_PADDING_BOTTOM;

    const style = {
      maxHeight
    };

    return JSX(`
      <div className="measures-tile" style={style}>
        <TileHeader
          title="Measures"
          onSearch={this.toggleSearch.bind(this)}
          onClose={clicker.unpin.bind(clicker, 'measures')}
        />
        <div className="rows">{rows}</div>
      </div>
    `);
  }
}
