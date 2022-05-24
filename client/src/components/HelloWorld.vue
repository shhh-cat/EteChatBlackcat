<template>
  <div class="container mx-auto">
      <div class="min-w-full border rounded lg:grid lg:grid-cols-3 h-screen">
        <div class="border-r border-gray-300 lg:col-span-1">
          <div class="mx-3 my-3">
            <form class="flex gap-x-3">
                <h2 class="flex-grow rounded-lg text-md border-transparent flex-1 appearance-none w-full py-2 px-4 bg-white text-gray-700 placeholder-gray-400 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent" placeholder="Search">{{ user.name ? "Chào "+ user.name : "Bạn đang vô danh" }}</h2>
                <button @click.prevent="joinRoomForm()" class="flex-none px-4 py-2 text-base font-semibold text-white bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-purple-200" type="submit">
                    Tham gia phòng
                </button>
            </form>
          </div>

          <ul class="overflow-auto h-[32rem]">
            <h2 class="my-2 mb-2 ml-2 text-lg text-gray-600">Chats</h2>
            <li v-if="rooms.length == 0" class="flex items-center justify-center text-gray-600 px-3 py-4 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none">
              <span>Không có phòng nào có người tham gia</span>
            </li>
            <li>
              <a v-for="(room, index) in rooms" :key="index" @click.prevent="currentRoom.name ? changeRoom(room.name) : joinRoom(room.name)"
                class="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none">
                <div class="w-full py-2">
                  <div class="flex justify-between">
                    <span class="block ml-2 font-semibold text-gray-600">PHÒNG {{ room.name }}</span>
                    <span class="block ml-2 text-sm text-gray-600">{{ room.count }} người đã tham gia</span>
                  </div>
                  <!-- <span class="block ml-2 text-sm text-gray-600">bye</span> -->
                </div>
              </a>
            </li>
          </ul>
        </div>
        <div class="lg:col-span-2 hidden lg:flex flex-col" v-if="currentRoom.name">
            <div class="relative w-full flex items-center justify-between p-3 border-b border-gray-300">
              <!-- <img class="object-cover w-10 h-10 rounded-full"
                src="https://ui-avatars.com/api/?name=user" alt="username" /> -->
              <span class="block ml-2 font-bold text-gray-600">Phòng: [ {{currentRoom.name }} ]</span>
              <span class="block ml-2 text-sm text-gray-600">{{ currentRoomSize }} người đã tham gia</span>
      
            </div>
            <div class="relative w-full p-6 overflow-y-auto flex flex-grow">
              <ul class="space-y-2 w-full">
                <li v-for="(message, index) in currentRoom.messages" :key="index" :class="'flex '+ (message.from== user.name ? 'justify-end' : 'justify-start')">
                
                  <div v-if="message.from == user.name" class="relative max-w-xl px-4 py-2 text-gray-700 bg-gray-100 rounded shadow">
                    <span class="block">{{ message.content }}</span>
                  </div>
                  <div v-else class="relative max-w-xl  text-gray-700 ">
                    <span class="block text-sm text-gray-500 mb-1" v-if="index == 0">{{ message.from}}</span>
                    <span class="block text-sm text-gray-500 mb-1" v-else-if="!(currentRoom.messages[index - 1].from == message.from)">{{ message.from}}</span>
                    <span class="block px-4 py-2 rounded shadow">{{ message.content }}
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div class="flex items-center justify-between w-full p-3 border-t border-gray-300">

              <input type="text" placeholder="Message" v-on:keyup.enter="sendMessage()" 
                class="block w-full py-2 pl-4 mx-3 bg-gray-100 rounded-full outline-none focus:text-gray-700"
                v-model="typing" required />
            
              <button @click.prevent="sendMessage()">
                <svg class="w-5 h-5 text-gray-500 origin-center transform rotate-90" xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20" fill="currentColor">
                  <path
                    d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
        </div>
        <div class="lg:col-span-2 flex justify-center items-center" v-else>
            <img width="500" src="../assets/chat-animate.svg"/>
          
        </div>
      </div>
    </div>
</template>

<script>
//const Crypto = require('crypto-browserify')
import NodeRSA from 'node-rsa';
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data: function() {
    return {
      rooms: [],
      user: {
        name: '',
        clientRSA: {
          publicKey: null,
          privateKey: null,
        },
      },
      currentRoom: {
        name: null,
        messages: [],
      },
      typing: '',
      serverRSA: null,
    }
  },
  sockets: {
    chat: function(data) {
      var app = this;
      if (data.forTo == app.user.name)
        app.currentRoom.messages.push({
          from: data.from,
          content: app.$decrypt(app.user.clientRSA.privateKey,data.content)
        });
      console.log(app.currentRoom.messages)
    },
    syncRooms: function(data) {
      this.rooms = data;
      //console.log(Object.entries(data))
      // data.forEach (function(value, key) {
      //   console.log(key + ": " + value);
      // })
      
    }
  },
  mounted() {

    var app = this;
    // app.loadClientRSA().then(() => {
    //   console.log(app.user.clientRSA)
      
    // });
    app.loadClientRSA();
    app.authenticate();
    
  },
  methods: {
    setCurrentRoom(currentRoom) {
      this.currentRoom =  currentRoom;
    },
    loadClientRSA() {
      var app = this;
      const nodeRSA = new NodeRSA({b : 2048});
      //console.log(nodeRSA.encrypt('test','base64'));
      app.user.clientRSA = {
        publicKey: nodeRSA.exportKey('public'),
        privateKey: nodeRSA.exportKey('private')
      } 
      // var a = app.$encrypt(app.user.clientRSA.publicKey,"test");
      // console.log(a);
      // console.log(app.$decrypt(app.user.clientRSA.privateKey,a))
      // console.log(this.user.clientRSA.encrypt("test",'base64'));
    },
    sendMessage() {
      var app = this;
      if (!app.typing)
        app.$swal('Lỗi','Bạn cần nhập thứ gì đó!','error');
      else if (!app.currentRoom.name)
        app.$swal('Lỗi','Bạn cần tham gia nhóm trước khi gửi tin nhắn','error');
      else {
        app.$socket.emit('chat' ,app.$encrypt(app.serverRSA,app.typing,2048), (callback) => {
          if (!callback) app.$swal('Lỗi','Gửi tin nhắn thẩt bại','error');
          app.typing = '';
        });}
    },
    authenticate() {
      var app = this;
      app.$swal({
        title: 'Tên của bạn là gì',
        input: 'text',
        inputLabel: 'Nhập tên',
        showCancelButton: false,
        allowOutsideClick: false,
        confirmButtonText: "Kết nối",
        inputValidator: (value) => {
          if (!value) {
            return 'Bạn cần nhập thứ gì đó!'
          }
          if (value == "[HỆ THỐNG]" || value.toLowerCase().includes("hệ thống") || value.toLowerCase().includes("he thong")) {
            return 'Đừng fake [HỆ THỐNG] nhé!'
          }
        }
      }).then((result) => {
        
          
        if (result.value && app.user.clientRSA) 
          app.$socket.emit("authenticate", {
            name: result.value,
            clientRSA: app.user.clientRSA.publicKey,
          }, (callback, serverRSA) => {
            if (callback) {
              app.user.name = result.value;  
              app.$swal(`Kết nối thành công`,'','success')
              app.serverRSA = serverRSA;
            }
            else {
              app.$swal(`Kết nối thất bại`,'Lỗi máy chủ hoặc Tên của bạn đã được sử dụng','error').then(() => {
                app.authenticate();
              })
              
            }
              
          })
        
      })
    },
    leaveRoom() {
      var app = this;
      if (app.currentRoom.name)
        app.$socket.emit("leaveRoom", app.currentRoom.name , (callback) => {
          if (callback) {
            app.currentRoom = {
              name: null,
              messages: [],
            };
          }
          else
            app.$swal(`Rời khỏi phòng ` + app.currentRoom.name + ' thất bại' )
        });
    },
    changeRoom(room) {
      var app = this;
      if (app.currentRoom.name && app.currentRoom.name != room)
        app.$socket.emit("changeRoom", room, (callback) => {
          if (callback) {
            app.currentRoom.name = room;
            app.currentRoom.messages = [];
          }
          else
            app.$swal(`Tham gia phòng ` + room + ' thất bại' )
        });
      else
        app.$swal(`Bạn đang ở phòng ` + room , "", 'error' )
    },
    joinRoom(room) {
      var app = this;
      if (!app.currentRoom.name)
      app.$socket.emit("joinRoom", room, (callback) => {
        if (callback) {
          app.currentRoom.name = room;
          console.log(app.currentRoom.name); 
        }
        else
          app.$swal(`Tham gia phòng ` + room + ' thất bại' )
      });
    },
    joinRoomForm() {
      var app = this;
      app.$swal({
        title: 'Nhập ID phòng',
        input: 'text',
        inputLabel: 'ID phòng',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'Bạn cần nhập thứ gì đó!'
          }
          if (! (/^\d+$/.test(value))) {
            return 'ID phòng là 1 dãy số'
          }
        }
      }).then((result) => {
        if (result.value)
          if (app.currentRoom.name)
            app.changeRoom(result.value)
          else app.joinRoom(result.value)
      })
    }
  },
  computed: {
    currentRoomSize() {
      var app = this;
      if (app.currentRoom.name == null) return 0;
      else {
        return app.rooms.filter(obj => { return obj.name == app.currentRoom.name })[0].count;
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/* h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
} */
</style>
