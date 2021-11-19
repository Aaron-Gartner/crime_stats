// Built-in Node.js modules
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let app = express();
let port = 8000;

let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

// open stpaul_crime.sqlite3 database
// data source: https://information.stpaul.gov/Public-Safety/Crime-Incident-Report-Dataset/gppb-g9cg
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.json());


// REST API: GET /codes
// Respond with list of codes and their corresponding incident type
app.get('/codes', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let query = "SELECT * from Codes ORDER BY code ASC";
    let params;

    let codes = url.searchParams.get('code');
    if (codes) {
        params = codes.split(',');
        query = "SELECT * from Codes WHERE code = ?";

        for (let i = 1; i < params.length; i++) {
            query += "OR code = ?";
        }
        query += "ORDER BY code ASC";
    }

    databaseSelect(query, params)
    .then((data) => {
        res.status(200).type('json').send(data);
    })
    .catch((err) => {
        res.status(500).type('txt').send(err + ` for code(s) ${params}`);
    });
});

// REST API: GET /neighborhoods
// Respond with list of neighborhood ids and their corresponding neighborhood name
app.get('/neighborhoods', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let query = "SELECT * from Neighborhoods ORDER BY neighborhood_number ASC";
    let params;
    
    let neighborhoods = url.searchParams.get('id');
    if (neighborhoods) {
        params = neighborhoods.split(',');
        query = "SELECT * from Neighborhoods WHERE neighborhood_number = ?";

        for (let i = 1; i < params.length; i++) {
            query += "OR neighborhood_number = ?";
        }
        query += "ORDER BY neighborhood_number ASC";
    }

    databaseSelect(query, params)
    .then((data) => {
        res.status(200).type('json').send(data);
    })
    .catch((err) => {
        res.status(500).type('txt').send(err + ` for id(s) ${params}`);
    });
});

// REST API: GET/incidents
// Respond with list of crime incidents
app.get('/incidents', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let query = "SELECT * from Incidents ";
    let params;

    let start_date = url.searchParams.get('start_date');
    let end_date = url.searchParams.get('end_date');
    let codes = url.searchParams.get('code');
    let grid = url.searchParams.get('grid');
    let neighborhood = url.searchParams.get('neighborhood');
    let limit = url.searchParams.get('limit');

    if (start_date) {
        start_date += "T00:00:00";
        query += " WHERE date_time >= ?";
        params = start_date;
    } else if (end_date) {
        end_date += "T23:59:59";
        query += " WHERE date_time <= ?";
        params = end_date;
    } else if (codes) {
        params = codes.split(',');
        query += " WHERE code = ?";

        for (let i = 1; i < params.length; i++) {
            query += " OR code = ?";
        }
    } else if (grid) {
        params = grid.split(',');
        query += " WHERE police_grid = ?";
        
        for (let i = 1; i < params.length; i++) {
            query += " OR police_grid = ?";
        }
    } else if (neighborhood) {
        params = neighborhood.split(',');
        query += " WHERE neighborhood_number = ?";

        for (let i = 1; i < params.length; i++) {
            query += " OR neighborhood_number = ?";
        }
    }

    query += 'ORDER BY date_time ASC';
    if (limit) {
        query += ` LIMIT ${limit}`;
    } else {
        query += ' LIMIT 1000';
    }

    databaseSelect(query, params)
    .then((data) => {
        for (let i = 0; i < data.length; i++) {
            let date = data[i].date_time.split('T')[0];
            let time = data[i].date_time.split('T')[1];
            delete data[i]['date_time'];
            data[i]['date'] = date;
            data[i]['time'] = time;
        }
        res.status(200).type('json').send(data);
    })
    .catch((err) => {
        res.status(500).type('txt').send(err + ` for code(s) ${params}`);
    });
});

// REST API: PUT /new-incident
// Respond with 'success' or 'error'
app.put('/new-incident', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let case_number = req.body.case_number;
    let date = req.body.date;
    let time = req.body.time;
    let date_time = date + 'T' + time;
    let code = req.body.code;
    let incident = req.body.incident;
    let police_grid = req.body.police_grid;
    let neighborhood_number = req.body.neighborhood_number;
    let block = req.body.block;
    
    let query = "INSERT into Incidents values (?, ?, ?, ?, ?, ?, ?)";
    let params = [case_number, date_time, code, incident, police_grid, neighborhood_number, block];
    databaseInsert(query, params)
    .then(() => {
        res.status(200).type('txt').send('success');
    })
    .catch((err) => {
        res.status(500).type('txt').send(err);
    });
});

// REST API: DELETE /remove-incident
// Respond with 'success' or 'error'
app.delete('/remove-incident', (req, res) => {
    let case_number = req.body.case_number;

    let query = "DELETE from Incidents where case_number = ?";
    let params = case_number;
    databaseDelete(query, params)
    .then(() => {
        res.status(200).type('txt').send('success');
    })
    .catch ((err) => {
        res.status(500).type('txt').send(err);
    });
});


// Create Promise for SQLite3 database SELECT query 
function databaseSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                if (rows.length > 0) {
                    resolve(rows);
                }
                reject('ERROR: no data found');
            }
        })
    })
}

// Create Promise for SQLite3 database INSERT query
function databaseInsert(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject('ERROR: Could not insert incident\n' + err);
            }
            else {
                resolve();
            }
        });
    })
}


// Create Promise for SQLite3 database DELETE query
function databaseDelete(query, params) {
    return new Promise((resolve, reject) => {
        let query2 = "SELECT * from Incidents where case_number = ?";
        db.all(query2, params, (err, rows) => {
            if (rows.length > 0) {
                db.run(query, params, (err) => {
                    if (err) {
                        reject('ERROR: Could not delete incident\n' + err);
                    }
                    else {
                        resolve();
                    }
                });
            } else {
                reject('ERROR: Could not delete incident');
            }
        });
    });
}

// Start server
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
