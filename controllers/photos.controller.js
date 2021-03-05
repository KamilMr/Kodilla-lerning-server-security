const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

const escape = (html) => {
  return html.replace(/&/g, "")
             .replace(/<*/g, "")
             .replace(/>/g, "")
             .replace(/"/g, "")
             .replace(/'/g, "");
}


exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;
    
    if(title.length <= 50 && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if(fileExt == 'jpg' || fileExt == 'png' || fileExt == 'gif'){
        const newPhoto = new Photo({ title: escape(title), author: escape(author), email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }else throw new Error('Wrong input!');

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const clientIp = requestIp.getClientIp(req);
    const IsIpInDB =  await Voter.findOne({user: clientIp});
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    if(IsIpInDB === null){
      const newVoter = new Voter ({user: clientIp, vote: photoToUpdate._id})
      await newVoter.save();
      photoToUpdate.votes++;
      photoToUpdate.save();
    } else  {
      let IsPicInIp = await Voter.findOne({ vote: photoToUpdate._id });
      if(!IsPicInIp){
        IsIpInDB.vote.push(photoToUpdate._id);
        IsIpInDB.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
      } else {
        res.status(405).json({ message: '405 Method Not Allowed' })
        }
      }
      res.send({ message: 'OK' });
  } catch(err) {
    res.status(500).json(err);
  }

};
