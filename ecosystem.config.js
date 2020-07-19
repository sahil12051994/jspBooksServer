module.exports = {
  apps : [{
    name   : "faceRecog",
    script : "./app.js",
    watch  : true,
    instances  : 1,
    exec_mode  : "cluster",
    ignore_watch : ["node_modules", ".git", "utils", "uploads", "test"]
  }]
}
