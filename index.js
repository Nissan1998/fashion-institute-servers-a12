const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

// middle-ware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("fashion is ongoing.........");
});

app.listen(port, () => {
  console.log(`Fashion is ongoing on the ${port}`);
});
