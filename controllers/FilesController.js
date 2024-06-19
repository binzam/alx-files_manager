import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId !== 0) {
      const parentFile = await dbClient.getFileFromDb(parentId);
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    const fileDocument = {
      userId: user._id,
      name,
      type,
      parentId,
      isPublic,
    };
    if (type === 'folder') {
      const newFile = await dbClient.saveFileInDb(fileDocument);
      return res.status(201).json(newFile);
    }
    const fileContent = Buffer.from(data, 'base64');
    const filePath = path.join(FOLDER_PATH, uuidv4());
    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
    }
    fs.writeFileSync(filePath, fileContent);
    const fileWithLocalPath = { ...fileDocument, localPath: filePath };

    const newFile = await dbClient.saveFileInDb(fileWithLocalPath);
    return res.status(201).json(newFile);
  }
}
export default FilesController;
