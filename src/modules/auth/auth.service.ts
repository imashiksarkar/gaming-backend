import { db } from '@/config'

export default class AuthService {
  private static readonly dbService: typeof db = db

  static readonly getTest = async () => {
    return 'test'
  }
}
