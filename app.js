const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


//establish database connection
mongoose.connect("mongodb://localhost:27017/todolistDB");

//todo Schema
mongoose.S
const itemSchema = new mongoose.Schema({
  name: String
});

// item model
const Item = mongoose.model("Item", itemSchema);

//initial items
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//custom list schema
const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({},function(err, listItems) {
    if(err) {
      res.send("Database Error!!!");

    } else if(listItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          res.send("Database Error!!!");

        } else {
          console.log("successfully saved default items.");
          res.render("list",{listTitle: "Today", listItems: defaultItems});

        }
      })

    } else {

      res.render("list",{listTitle: "Today", listItems: listItems});
    }
  })
})

app.post("/", function(req, res) {

  const itemName = req.body.todo;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      if(err) {
        res.send("Database Error!");
      } else {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + foundList.name);
      }
    });
  }

})

app.get("/:listName", function(req, res) {
  const listName = _.capitalize(req.params.listName);


  List.findOne({name: listName}, function(err, foundList) {
    if(err) {
      res.send("Database Error");
    } else if(!foundList) {

      const list = new List({
        name: listName,
        items: defaultItems
      });

      list.save();
      res.render("list",{listTitle: listName, listItems: defaultItems});
    } else {
      res.render("list",{listTitle: foundList.name, listItems: foundList.items});
    }
  });

  //res.render("list", {listTitle: "Work List", listItems: workItems});
})

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.deleteOne({_id: checkedItemId}, function(err) {
      if(err) {
        res.send("Database Error");
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if(err) {
        res.send("Database Error");
      } else {
        res.redirect("/" + listName);
      }
    });
  }

})

app.listen(port, function() {
  console.log(`Server is running on port ${port}`);
})
