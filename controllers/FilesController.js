/* eslint-disable consistent-return */
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import { findUserFileById } from '../utils/file';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const ROOT_FOLDER_ID = 0;
const MAX_FILES_PER_PAGE = 20;
const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');
const isValidId = (id) => {
  const size = 24;
  let i = 0;
  const charRanges = [
    [48, 57], // 0 - 9
    [97, 102], // a - f
    [65, 70], // A - F
  ];
  if (typeof id !== 'string' || id.length !== size) {
    return false;
  }
  while (i < size) {
    const c = id[i];
    const code = c.charCodeAt(0);

    if (!charRanges.some((range) => code >= range[0] && code <= range[1])) {
      return false;
    }
    i += 1;
  }
  return true;
};
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

  static async getShow(req, res) {
    try {
      const { user } = req;
      console.log('getshow user', user);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { id } = req.params;
      const file = await findUserFileById(user._id, id);
      console.log('getshow file', file);
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json(file);
    } catch (error) {
      console.error('Error in getShow:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getIndex(req, res) {
    try {
      const { user } = req;
      const parentId = req.query.parentId || ROOT_FOLDER_ID.toString();
      const page = /\d+/.test((req.query.page || '').toString())
        ? Number.parseInt(req.query.page, 10)
        : 0;
      const db = dbClient.client.db(dbClient.database);
      const filesCollection = db.collection('files');
      const filesFilter = {
        userId: user._id,
        parentId: parentId === ROOT_FOLDER_ID.toString()
          ? parentId
          : new ObjectId(isValidId(parentId) ? parentId : NULL_ID),
      };

      const files = filesCollection
        .aggregate([
          { $match: filesFilter },
          { $sort: { _id: -1 } },
          { $skip: page * MAX_FILES_PER_PAGE },
          { $limit: MAX_FILES_PER_PAGE },
          {
            $project: {
              _id: 0,
              id: '$_id',
              userId: '$userId',
              name: '$name',
              type: '$type',
              isPublic: '$isPublic',
              parentId: {
                $cond: {
                  if: { $eq: ['$parentId', '0'] },
                  then: 0,
                  else: '$parentId',
                },
              },
            },
          },
        ])
        .toArray();
      res.status(200).json(files);
    } catch (error) {
      console.error('Error in getIndex:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
export default FilesController;
