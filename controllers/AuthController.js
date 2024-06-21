import {
  getCredFromAuthToken,
  generateSessionToken,
  authenticateUser,
  getSessionToken,
  deleteSessionToken,
} from '../utils/auth';

class AuthController {
  static async getConnect(req, res) {
    try {
      const { email, password } = getCredFromAuthToken(req);
      if (!email || !password) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }
      const user = await authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }

      const token = await generateSessionToken(user._id);
      return res.status(200).json(token);
    } catch (error) {
      console.error('Error in getConnect:', error);
      return res
        .status(500)
        .json({ error: 'An error occurred while processing the request' });
    }
  }

  static async getDisconnect(req, res) {
    try {
      const token = getSessionToken(req);
      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }

      const result = await deleteSessionToken(token);
      if (!result) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }
      return res.status(204).send();
    } catch (error) {
      console.error('Error in disconnect:', error);
      return res
        .status(500)
        .json({ error: 'error occurred while processing the request' });
    }
  }
}

export default AuthController;
