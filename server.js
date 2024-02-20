const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middleware/authMiddleware');


const app = express();
app.use(cors(
  {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
));
app.use(express.json());
app.use(cookieParser());


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crud'
});

// app.get('/data', (req, res) => {
//   const sql = 'SELECT * FROM student';
//   db.query(sql, (error, result) => {
//     if (error) 
//     return res.json(error);
//     res.json(result);
//   });
// });

// app.get('/delete/:id', (req, res) => {
//   const id = req.params.id;
//   const sql = 'SELECT * FROM student WHERE id = ?';
//   db.query(sql, [id], (error, result) => {
//     if (error) return res.json(error);
//     res.json(result[0]);
//   });
// });

// app.post('/create', (req, res) => {
//   const name = req.body.name;
//   const email = req.body.email;
//   const sql = 'INSERT INTO student (name, email) VALUES (?, ?)';
//   db.query(sql, [name, email], (error, result) => {
//     if (error) 
//     return res.json(error);
//     res.json(result);
//   });
// });

// app.put('/edit/:id', (req, res) => {
//   const id = req.params.id;
//   const name = req.body.name;
//   const email = req.body.email;
//   const sql = 'UPDATE student SET name = ?, email = ? WHERE id = ?';
//   db.query(sql, [name, email, id], (error, result) => {
//     if (error) return res.json(error);
//     res.json(result);
//   });
// });

app.delete('/delete/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM tax WHERE id = ?';
  db.query(sql, [id], (error, result) => {
    if (error) return res.json(error);
    res.json(result);
  });
});


app.post('/register', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  bcrypt.hash(password, 10, (error, hash) => {
    if (error) return res.json(error);
    const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(sql, [name, email, hash], (error, result) => {
      if (error) return res.json(error);
      res.json(result);
    });
  });});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (error, result) => {
    if (error) 
    return res.json(error);
  
    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (error, response) => {
        if (error) return res.json(error);
        if (response) {
          const id = result[0].id;
          const token = jwt.sign({ id }, 'jwtSecret', {
            expiresIn: 86400000,
          });
          res.cookie('jwt', token, { httpOnly: true, maxAge: 86400000 });
          res.json({ auth: true, token: token, result: result });
        } else {
          res.json({ auth: false, message: 'Wrong username/password combination!' });
        }
      });
    } else {
      res.json({ auth: false, message: 'No user exists!' });
    }
  });
});

const verifyJWT = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    res.json({ auth: false, message: 'No token provided!' });
  } else {
    jwt.verify(token, 'jwtSecret', (error, decoded) => {
      if (error) {
        res.json({ auth: false, message: 'Failed to authenticate!' });
      } else {
        req.userId = decoded.id;
        next();
      }
    });
  }
};

app.get('/', verifyJWT, (req, res) => {
  const sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [req.userId], (error, result) => {
    if (error) return res.json(error);
    res.json({ auth: true, id: result[0].id, name: result[0].name, email: result[0].email });
  });
});

app.get('/logout', (req, res) => {
  res.cookie('jwt', 'logout', { maxAge: 1 });
  res.json({ status: 200 });
});

// app.post('/taxcal', (req, res) => {
//   const salary = req.body.salary;
//   const role = req.body.role;
//   let employeeTaxRate;
//   if (role === 'employee') {
//     employeeTaxRate = 0.25;
//   } else {
//     employeeTaxRate = 0.30;
//   }
//   let tax = 0;
//   if (salary <= 100000) {
//     tax = 0;
//   } else if (salary < 141667 && salary > 100000) {
//     tax = 0.06 * salary;
//   } else if (salary >= 141667 && salary < 183333) {
//     tax = 0.12 * salary;
//   }
//   else if (salary >= 183333 && salary < 225000) {
//     tax = 0.18 * salary;
//   }
//   else if (salary >= 225000 && salary < 266667) {
//     tax = 0.24 * salary;
//   }
//   else if (salary >= 266667 && salary < 308333) {
//     tax = 0.30 * salary;
//   }
//    else {
//     tax = 0.36 * salary;
//   }

//   let homeSalary = salary - tax;
//   res.json({homeSalary : homeSalary , tax : tax}) ;
//   //res.send(`The tax for ${salary} is ${tax}.`);
//   // res.json(tax);
// });

app.post('/taxcal', (req, res) => {
  const salary = req.body.salary;
  const role = req.body.role;
  let tax = 0;
  let EPFDeduction = 0;
  let ETFDeduction = 0;
  let employerEPFDeduction = 0;

  if (salary <= 100000) {
    tax = 0;
  } else if (salary < 141667 && salary > 100000) {
    tax = 0.06 * salary;
  } else if (salary >= 141667 && salary < 183333) {
    tax = 0.12 * salary;
  } else if (salary >= 183333 && salary < 225000) {
    tax = 0.18 * salary;
  } else if (salary >= 225000 && salary < 266667) {
    tax = 0.24 * salary;
  } else if (salary >= 266667 && salary < 308333) {
    tax = 0.30 * salary;
  } else {
    tax = 0.36 * salary;
  }

  // Calculate EPF and ETF deductions based on role
  if (role === 'employee') {
    EPFDeduction = salary * 0.12; // 12% of employee's monthly gross earnings
    ETFDeduction = salary * 0.08; // 8% of employee's monthly gross earnings
  } else if (role === 'employer') {
    EPFDeduction = salary * 0.12; // 12% of employee's monthly gross earnings
    ETFDeduction = salary * 0.08; // 8% of employee's monthly gross earnings
    employerEPFDeduction = salary * 0.03; // 3% of every employee’s monthly total earnings
  }

  const totalDeductions = EPFDeduction + ETFDeduction + employerEPFDeduction;

  let homeSalary = salary - tax - totalDeductions;

  res.json({
    homeSalary: homeSalary,
    tax: tax,
    EPFDeduction: EPFDeduction,
    ETFDeduction: ETFDeduction,
    employerEPFDeduction: employerEPFDeduction,
    totalEPF_ETF: totalDeductions,
  });
});


app.post('/save-salary', (req, res) => {
  
  const id = req.body.id;
  const description = req.body.description;
  const tax = req.body.tax;
  const salary = req.body.salary;
  const homeSalary = req.body.homeSalary;
  const sql = 'INSERT INTO tax (user_id, description, salary, tax, homeSalary) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [id, description, salary, tax, homeSalary], (error, result) => {
    if (error) return res.json(error);
    res.json(result);
  });
})

app.get('/report', (req, res) => {
  const id = req.query.id;
  const sql = 'SELECT * FROM tax where user_id = ?';
  db.query(sql, [id], (err, rows) => {
    if (err) throw err;
    res.json(rows);
  })});

 

//conection with mysql server

app.listen(8000, () => console.log('Server running on port 8000'));