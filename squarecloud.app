name = "WorkplaceSurveyDashboard"
display_name = "Workplace Survey Dashboard"
type = "node"
main = "index.html"
version = "1.0.0"
memory = "512MB"

[deployment]
build_command = "npm install"
start_command = "npm start"

[env]
NODE_ENV = "production"
PORT = "80"