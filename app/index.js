const express = require('express');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const dbURI = 'mongodb+srv://chunj796:qwer@jaydb.1dp0khb.mongodb.net/?retryWrites=true&w=majority';
const bodyParser = require('body-parser');
const app = express();

app.use(express.static('src'));
app.use(express.static('/src/abis'));
app.use(bodyParser.json());

mongoose.connect(dbURI);
var db = mongoose.connection;

db.on('error', function() {
  console.log('Connection Failed!');
});

db.once('open', function() {
  console.log('Connected!');
});

// Define a schema and model
var CharacterSchema = new mongoose.Schema({
    name: String,
    token: Number,
    SkinList: [String],
    Owner: String
});
var Character = mongoose.model('Character', CharacterSchema);

// Endpoint to add character
app.post('/addCharacter', (req, res) => {
    const newCharacter = new Character(req.body);
    newCharacter.save()
      .then(item => res.send("Item saved to database"))
      .catch(err => res.status(400).send("Unable to save to database"));
});

app.get('/findCharactersbyOwner/:owner', (req, res) => {
    const ownerValue = req.params.owner;
    const query = ownerValue ? { Owner: ownerValue } : {};

    Character.find(query)
        .then(characters => {
            res.json(characters);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Error finding characters" });
        });
});

app.post('/updateCharacterOwner', (req, res) => {
    const { characterName, newOwner } = req.body;

    Character.findOneAndUpdate(
        { name: characterName },
        { $set: { Owner: newOwner } },
        { new: true }
    )
    .then(updatedCharacter => {
        if (!updatedCharacter) {
            return res.status(404).json({ error: `Character with name '${characterName}' not found.` });
        }
        res.json({ message: `Character '${characterName}' Owner updated to '${newOwner}'.` });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: "Error updating character Owner." });
    });
});

app.delete('/deleteCharacter/:name', (req, res) => {
    Character.findOneAndDelete({ name: req.params.name })
        .then(deletedCharacter => {
            if (!deletedCharacter) {
                return res.status(404).json({ error: `Character not found with name: ${req.params.name}` });
            }
            res.json({ message: "Character deleted", deletedCharacter });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Error deleting character", details: err.message });
        });
});

app.get('/findCharacter/:name', (req, res) => {
    Character.findOne({ name: req.params.name })
        .select('token')
        .then(character => {
            if (!character) {
                return res.status(404).json({ error: "Character not found" });
            }
            res.json(character.token);
        })
        .catch(err => res.status(400).json({ error: "Error finding character" }));
});

app.get('/CharExist/:name', (req, res) => {
    Character.findOne({ name: req.params.name })
    .then (character =>{
        if (character) {
            res.json(true);
        } else {
            res.json(false);
        }
    })
})

app.get('/Owner/:name', (req, res) => {
    Character.findOne({ name: req.params.name })
    .then (character =>{
        if (character) {
            res.json(character.Owner);
        } else {
            return res.status(404).json({ error: "Character not found" });
        }
    })
})

CharacterSchema.methods.addSkinToList = function(skin) {
    this.SkinList.push(skin);
    return this.save(); 
};

app.post('/addSkinToCharacter/:characterName', (req, res) => {
    const skinName = req.body.name;

    Character.findOne({ name: req.params.name })
        .then(character => {
            if (!character) {
                return res.status(404).json({ error: "Character not found" });
            }

            character.addSkinToList(skinName)
                .then(updatedCharacter => {
                    res.json({ message: "Skin added to character", character: updatedCharacter });
                })
                .catch(error => {
                    console.error('Error adding skin to character:', error);
                    res.status(500).json({ error: "Error adding skin to character" });
                });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Error finding character" });
        });
});

var SkinSchema = new mongoose.Schema({
    name: String,
    token: Number,
    Owner: String
});
var Skin = mongoose.model('Skin', SkinSchema);

app.post('/addSkin', (req, res) => {
    const newSkin = new Skin(req.body);
    newSkin.save()
        .then(item => res.send("Skin saved to database"))
        .catch(err => res.status(400).send("Unable to save to database"));
});

app.delete('/deleteSkin/:name', (req, res) => {
    Skin.findByIdAndDelete(req.params.id)
        .then(() => res.json({ message: "Skin deleted" }))
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Error deleting skin" });
        });
});

app.get('/findSkin/:name', (req, res) => {
    Skin.findOne({ name: req.params.name })
        .select('token')
        .then(skin => {
            if (!skin) {
                return res.status(404).json({ error: "Skin not found" });
            }
            res.json(skin.token);
        })
        .catch(err => {
            console.error(err);
            res.status(400).json({ error: "Error finding skin" });
        });
});

app.get('/SkinExist/:name', (req, res) => {
    Skin.findOne({ name: req.params.name })
    .then (skin =>{
        if (skin) {
            res.json(true);
        } else {
            res.json(false);
        }
    })
})

app.get('/SkinOwner/:name', (req, res) => {
    Skin.findOne({ name: req.params.name })
    .then (character =>{
        if (character) {
            res.json(character.Owner);
        } else {
            return res.status(404).json({ error: "Character not found" });
        }
    })
})

app.post('/updateSkinOwner', (req, res) => {
    const { skinName, newOwner } = req.body;

    Skin.findOneAndUpdate(
        { name: skinName },
        { $set: { Owner: newOwner } },
        { new: true }
    )
    .then(updatedSkin => {
        if (!updatedSkin) {
            return res.status(404).json({ error: `Skin with name '${skinName}' not found.` });
        }
        res.json({ message: `Skin '${skinName}' Owner updated to '${newOwner}'.` });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: "Error updating Skin Owner." });
    });
});

app.get('/findSkinsbyOwner/:owner', (req, res) => {
    const ownerValue = req.params.owner;
    const query = ownerValue ? { Owner: ownerValue } : {};

    Skin.find(query)
        .then(skins => {
            res.json(skins);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Error finding Skins" });
        });
});


app.get('/', function (req, res) {
    res.render('index.html');
});

app.listen(3000, () => {
    console.log('App listening on port 3000');
});
