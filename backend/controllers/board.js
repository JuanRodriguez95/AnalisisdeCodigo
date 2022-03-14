import board from "../models/board.js";
import fs from "fs";
import path from "path";
import moment from "moment";

const saveTask = async (req, res) => {
  if (!req.body.name || !req.body.description)
    return res.status(400).send({ message: "Incomplete data" });

  const boardSchema = new board({
    userId: req.user._id,
    name: req.body.name,
    description: req.body.description,
    taskStatus: "to-do",
    imageUrl: "",
  });

  const result = await boardSchema.save();
  return !result
    ? res.status(400).send({ message: "Error registering task" })
    : res.status(200).send({ result });
};

const saveTaskImg = async (req, res) => {
  console.log(req.files.image);
  if (!req.body.name || !req.body.description)
    return res.status(400).send({ message: "Incomplete data" });

  let imageUrl = "";
  
  //1.evalua si dentro del atributo files de request ahi algo
  if (Object.keys(req.files).length === 0) {
    imageUrl = "";
  } 
  else 
  {
    //2. evalua si lo que hay dentro de files es una imagen
    if (req.files.image) {

      //3.veirifca que el type sea diferente de null, es decir, que exista
      
      if (req.files.image.type != null) {
        
        //4. Crea la url host del archivo , en este caso: http://localhost:3001/
        const url = req.protocol + "://" + req.get("host") + "/";

        //5. crea la direccion dontre se guardara la imagen dentro del servidor localhost
        const serverImg =
          "./uploads/" + //Carpeta destino
          moment().unix() +  //nombre del archivo dentro del servidor
          path.extname(req.files.image.path); //la extencion del archivo (jpg,png,etc..)

        fs.createReadStream(req.files.image.path) // lee el archivo cargado en el request y que se almacena temporalmente en el servidor
        .pipe(fs.createWriteStream(serverImg)); // transmitirlo a la direccion estipulada en serverImg para que se guarde y pueda ser consultada.
        console.log(req.files.image);
        console.log(serverImg);

        imageUrl = // la direccion del archivo dentro del servidor, es decir en la carpeta uploads
          url +
          "uploads/" + 
          moment().unix() +
          path.extname(req.files.image.path);
      }
    }
  }
  console.log(imageUrl);
  const boardSchema = new board({
    userId: req.user._id,
    name: req.body.name,
    description: req.body.description,
    taskStatus: "to-do",
    imageUrl: imageUrl,
  });

  const result = await boardSchema.save();
  if (!result)
    return res.status(400).send({ message: "Error registering task" });
  return res.status(200).send({ result });
};

const listTask = async (req, res) => {
  const taskList = await board.find({ userId: req.user._id });
  return taskList.length === 0
    ? res.status(400).send({ message: "You have no assigned tasks" })
    : res.status(200).send({ taskList });
};

const updateTask = async (req, res) => {
  if (!req.body._id || !req.body.taskStatus)
    return res.status(400).send({ message: "Incomplete data" });

  const taskUpdate = await board.findByIdAndUpdate(req.body._id, {
    taskStatus: req.body.taskStatus,
  });

  return !taskUpdate
    ? res.status(400).send({ message: "Task not found" })
    : res.status(200).send({ message: "Task updated" });
};

const deleteTask = async (req, res) => {
  let taskImg = await board.findById({ _id: req.params["_id"] });

  taskImg = taskImg.imageUrl;
  taskImg = taskImg.split("/")[4];
  let serverImg = "./uploads/" + taskImg;

  const taskDelete = await board.findByIdAndDelete({ _id: req.params["_id"] });
  if (!taskDelete) return res.status(400).send({ message: "Task not found" });

  try {
    if (taskImg) fs.unlinkSync(serverImg);
    return res.status(200).send({ message: "Task deleted" });
  } catch (e) {
    console.log("Image no found in server");
  }
};

export default { saveTask, saveTaskImg, listTask, updateTask, deleteTask };
