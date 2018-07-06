var posts = localforage.createInstance({
  name: "posts"
})

 
function getData() {
    fetch("http://localhost:3000/posts/")
    .then(function(response) {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response
    }).then(function(response) {
        console.log("ok")
        return response.json()
    }).then(function(data) {
        data.forEach(result => {
            posts.setItem(result.id, result)
        });

    }).catch(function(error) {
        console.log(error)
    })
}

var value = {title: 'example', body: 'Hey Body'};

function addData(key, value) {
    posts.setItem(key, value)

    fetch("http://localhost:3000/posts/", {
      method: 'POST', // or 'PUT'
      body: JSON.stringify(value), // data can be `string` or {object}!
      headers:{
        'Content-Type': 'application/json',
        'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE1MzA3OTE0MTR9.NYNj7K4ymzw84DpuX1BukagZRHbW_KX0LQzJ2GO0toc'
      }
    }).then(res => res.json())
    .catch(error => console.log('Error:', error))
    .then(response => console.log('Success:', response))
}

addData(12, value)