import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueSweetalert2 from 'vue-sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import VueSocketIO from 'vue-socket.io'
import './assets/tailwind.css'
import { JSEncrypt } from 'jsencrypt'  
//const NodeRSA = require('node-rsa')

//const fs = require('fs');

Vue.config.productionTip = false

Vue.use(new VueSocketIO({
  debug: true,
  connection: 'http://localhost:3000',
}))

Vue.use(VueSweetalert2);

// Vue.prototype.$NodeRSA = NodeRSA;
Vue.prototype.$encrypt = function(publicKey, data, keySize = null) {
  //new an object
  let encrypt = new JSEncrypt({
    default_key_size: keySize,
  })
  //Setting public key
  encrypt.setPublicKey(publicKey)
  //password is the data to be encrypted. You don't need to pay attention to the + sign here, because rsa itself has already transcoded base64, and there is no +. It's all binary data
  let result = encrypt.encrypt(data)
  return result
}
//JSEncrypt decryption method
Vue.prototype.$decrypt = function(privateKey, data, keySize = null) {
  // New JSEncrypt object
  let decrypt = new JSEncrypt({
    default_key_size: keySize,
  })
  // Set private key
  decrypt.setPrivateKey(privateKey)
  // Declassified data
  let result = decrypt.decrypt(data)
  return result
}

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
