//==(IMPORT PACKAGES)============================
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

//==(INITIALIZE PACKAGES)=======================
//--[EXPRESS.JS]--------------------------------
const app = express();
const port = 3000;
//--[POSTGRES]----------------------------------
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "1301", //My learning PW
  port: 5432,
});
db.connect();
//==(SET UP MIDDLEWARES)=========================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//==[MY CODE]====================================
//==[F: checkVisited (Updates the visited countries array)]====
//F: Gets the visited country list from the visited_countries table
//F: Fills the countries array with the visited countries
//F: Returns the updated array

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

//==[GET HOME PAGE]==============================
//C: Renders the home page
//C: Uses async
//C: Sends locals of:
//C:    countries (countries array)
//C:    total (total countries visited)

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs", { countries: countries, total: countries.length });
});

//==[INSERT NEW COUNTRY: Route=/add]=============
//C: Handles a new country name entered in the form
//C: Checks to see if it's already in the list
//C: If it's not in the list, checks for valid country name
//C: If valid, adds it to the list and re-paints the screen
//C: NOTE that the failures render the /add page while a good answer renders the home page
app.post("/add", async (req, res) => {
  //--[GET USER INPUT FROM FORM]-----------------
  const input = req.body["country"];

  //--[TRY: Check if it is a valid country]------
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    //--[OK: Get the country_code]---------------
    const data = result.rows[0];
    const countryCode = data.country_code;
    //--[TRY: Check if already in the list]------
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      //--[OK: Repaint the home page]------------
      res.redirect("/");
    } catch (err) {
      //--[CATCH: Send already added message]----
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    //--[CATCH: Send not valid country message]
    console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});

//==(START SERVER)===============================
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
