<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBW48Juy_9i7lTeZrc5UIexty2tFGok8rA",
    authDomain: "ouvidoria-inovando.firebaseapp.com",
    databaseURL: "https://ouvidoria-inovando-default-rtdb.firebaseio.com",
    projectId: "ouvidoria-inovando",
    storageBucket: "ouvidoria-inovando.firebasestorage.app",
    messagingSenderId: "1031961404180",
    appId: "1:1031961404180:web:8d36b6948d0d2da2aad801",
    measurementId: "G-TF2BSGJR35"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
