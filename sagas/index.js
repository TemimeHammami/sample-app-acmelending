import { take, put, call, fork, select } from 'redux-saga/effects';
import * as actions from '../actions';
import * as gradeData from '../config/queries/gradeData';
import * as kpiData from '../config/queries/kpiData';
import * as kpiTotals from '../config/queries/kpiTotals';
import * as pivotData from '../config/queries/pivotData';
import * as trendData from '../config/queries/trendData';
import { createClient } from '../config';

/**
 * Orchestrates the async functions of the application.  See the root() method where 
 * components are executed.
 */

let queryData = [];
let gradeQueryRunning, kpiQueryRunning, kpiTotalQueryRunning, trendQueryRunning, pivotQueryRunning;

/**
 * fetchDataApi uses the Zoomdata SDK thread object to retrieve the query results.  The 
 * thread:notDirtyData event occurs when data is fully sharpen (e.g. results are complete).
 */
function fetchDataApi(thread, group) {
    var queryGroup = group;
    return new Promise( function(resolve, reject) {
        try {
            thread.on('thread:message', function(data) {
                queryData = data;
                resolve(queryData);
            });

            thread.on('thread:notDirtyData', function() {
                if (queryGroup === 'grade') {
                    gradeQueryRunning = false;
                } else if (queryGroup === 'kpi') {
                    kpiQueryRunning = false;
                } else if (queryGroup === 'kpitotals') {
                    kpiTotalQueryRunning = false;
                } else if (queryGroup === 'trend') {
                    trendQueryRunning = false;
                } else if (queryGroup === 'pivot') {
                    pivotQueryRunning = false;
                }
                resolve(queryData);
            });

            thread.on('thread:exeption', function(error) {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

function getQuery(client, source, queryConfig) {
    return client.createQuery(
        {name: source},
        queryConfig
    )
}

function getThread(client, query) {
    return client.run(query);
}


var makeSingleFilter = function(path) {
    return function(value) {
        var result = [];
        if (value !== undefined && value !== 'All') {
            result.push( {
              path: path,
              operation: 'IN',
              value: [value],
              "form": null
            });
        }
        return result;
    };
}

var makeMultiSelectFilter = function(path) {
    return function(value) {
        var result = [];
        if (value !== undefined && value.length > 0) {
            result.push( {
              path: path,
              operation: 'IN',
              value: value,
              "form": null
            });
        }
        return result;
    };
}

let GRADE_PATH = 'grade';
let LOAN_STATUS_PATH = 'loan_status';
let EMP_LENGTH_PATH = 'emp_length';

var trendGradeFilter = makeSingleFilter(GRADE_PATH);
var trendStatusFilter = makeSingleFilter(LOAN_STATUS_PATH);
var trendEmpLengthFilter = makeMultiSelectFilter(EMP_LENGTH_PATH);

function* changeTrendQuery(getState) {
    while(true) {
        yield take(actions.CHANGE_TREND_FILTER);
        var state = getState();

        var loanGrade = state.chartFilters.trendLoanGrade;
        var filters = trendGradeFilter(loanGrade);

        var loanStatus = state.chartFilters.trendLoanStatus;
        filters = filters.concat(trendStatusFilter(loanStatus));

        var empLength = state.chartFilters.trendEmpLength;
        filters = filters.concat(trendEmpLengthFilter(empLength));

        var filteredQueryConfig = Object.assign({}, trendData.queryConfig, 
            { filters: filters});

        TrendDataQuery.filters.remove(GRADE_PATH);
        TrendDataQuery.filters.remove(LOAN_STATUS_PATH);
        TrendDataQuery.filters.remove(EMP_LENGTH_PATH);
        TrendDataQuery.filters.add(filters);

        yield fork(fetchTrendData, TrendDataThread);
    }
}

function* fetchTrendData(client, source, queryConfig) {
    trendQueryRunning = true;
    try {
        if (!TrendDataQuery) {
            const query = yield call(getQuery, client, source, queryConfig);
            TrendDataQuery = query;
        }

        yield put(actions.requestTrendData(trendData.source));

        if (!TrendDataThread) {
            const thread = yield call(getThread, client, TrendDataQuery);
            TrendDataThread = thread;
        }

        while (trendQueryRunning) {
            const data = yield call(fetchDataApi, TrendDataThread, 'trend');
            if (trendQueryRunning) {
                yield put(actions.receiveTrendData(data));
            }
        }
    } catch (error) {
        yield put(actions.requestTrendDataFailed(error));
    }
}

function* fetchKPIData(client, source, queryConfig) {
    kpiQueryRunning = true;
    if (!KPIDataQuery) {
        const query = yield call(getQuery, client, source, queryConfig);
        KPIDataQuery = query;
    }
    yield put(actions.requestKPIData(kpiData.source));
    if (!KPIDataThread) {
        const thread = yield call(getThread, client, KPIDataQuery);
        KPIDataThread = thread;
    }
    while (kpiQueryRunning) {
        const data = yield call(fetchDataApi, KPIDataThread, 'kpi');
        if (kpiQueryRunning) {
            yield put(actions.receiveKPIData(data));
        }
    }
}

function* fetchKPITotals(client, source, queryConfig) {
    kpiTotalQueryRunning = true;
    if (!KPITotalQuery) {
        const query = yield call(getQuery, client, source, queryConfig);
        KPITotalQuery = query;
    }
    yield put(actions.requestKPITotals(kpiData.source));
    if (!KPITotalThread) {
        const thread = yield call(getThread, client, KPITotalQuery);
        KPITotalThread = thread;
    }
    while (kpiTotalQueryRunning) {
        const data = yield call(fetchDataApi, KPITotalThread, 'kpitotals');
        if (kpiTotalQueryRunning) {
            yield put(actions.receiveKPITotals(data));
        }
    }
}

function* fetchPivotData(client, source, queryConfig) {
    pivotQueryRunning = true;
    if (!PivotDataQuery) {
        const query = yield call(getQuery, client, source, queryConfig);
        PivotDataQuery = query;
    }
    yield put(actions.requestPivotData(pivotData.source));
    if (!PivotDataThread) {
        const thread = yield call(getThread, client, PivotDataQuery);
        PivotDataThread = thread;
    }
    while (pivotQueryRunning) {
        const data = yield call(fetchDataApi, PivotDataThread, 'pivot');
        if (pivotQueryRunning) {
            yield put(actions.receivePivotData(data));
        }
    }
}

function* fetchGradeData(client, source, queryConfig) {
    gradeQueryRunning = true;
    if (!GradeDataQuery) {
        const query = yield call(getQuery, client, source, queryConfig);
        GradeDataQuery = query;
    }
    yield put(actions.requestGradeData(gradeData.source));
    if (!GradeDataThread) {
        const thread = yield call(getThread, client, GradeDataQuery);
        GradeDataThread = thread;
    }
    while (gradeQueryRunning) {
        const data = yield call(fetchDataApi, GradeDataThread, 'grade');
        if (gradeQueryRunning) {
            yield put(actions.receiveGradeData(data));
        }
    }
}

function* startup(client) {
    yield fork(fetchGradeData, client, gradeData.source, gradeData.queryConfig);
    yield fork(fetchKPITotals, client, kpiTotals.source, kpiTotals.queryConfig);
    yield fork(fetchKPIData, client, kpiData.source, kpiData.queryConfig);
    yield fork(fetchTrendData, client, trendData.source, trendData.queryConfig);
    yield fork(fetchPivotData, client, pivotData.source, pivotData.queryConfig);
}

/**
 * Invokes the startup() method to perform the initial data requests.  It calls
 * also changeTrendQuery() to perform data requests when users filter the trend query.  
 */
export default function* root(getState) {
    const client = yield call(createClient);
    ZoomdataClient = client;
    yield call(client.sources.update, {name: 'Lending Club Loans Data'})
    yield fork(startup, ZoomdataClient);
    yield fork(changeTrendQuery, getState);
}

export let ZoomdataClient = undefined;
export let GradeDataQuery = undefined;
export let GradeDataThread = undefined;
export let KPIDataQuery = undefined;
export let KPIDataThread = undefined;
export let KPITotalQuery = undefined;
export let KPITotalThread = undefined;
export let TrendDataQuery = undefined;
export let TrendDataThread = undefined;
export let PivotDataQuery = undefined;
export let PivotDataThread = undefined;
