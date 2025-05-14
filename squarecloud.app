[application]
name = "WorkplaceSurveyDashboard"
display_name = "Workplace Survey Dashboard"
type = "static" # ou "node" se usar Node.js backend
main = "index.html"
version = "1.0.0"
memory = "512MB"

[deployment]
build_command = "npm install && npm run build" # Ajuste se usar build
start_command = "npx serve -s ."

[env]
NODE_ENV = "production"
PORT = "80"