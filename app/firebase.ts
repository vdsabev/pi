export class Firebase {
  static initialize() {
    firebase.initializeApp({
      apiKey: 'AIzaSyAbtk7MWP_hoMpAwmHNtLGYQNqKq_bs1aY',
      authDomain: 'journey-through-pi.firebaseapp.com',
      databaseURL: 'https://journey-through-pi.firebaseio.com',
      storageBucket: 'journey-through-pi.appspot.com'
    });
  }
}
