pipeline {
    agent any
    
    stages {
        stage('Clone & Clean') {
            steps {
                checkout scm
                sh 'docker compose down 2>/dev/null || true'
            }
        }
        
        stage('Build Images') {
            steps {
                sh '''
                echo "Building Docker images..."
                docker compose build
                '''
            }
        }
        
        stage('Start Services') {
            steps {
                sh '''
                echo "Starting containers..."
                docker compose up -d
                sleep 20
                docker compose ps
                '''
            }
        }
        
        stage('Basic Tests') {
            steps {
                sh '''
                echo "Testing MongoDB..."
                docker compose exec robot-mongo mongosh --eval "db.version()" --quiet || echo "MongoDB check failed"
                
                echo "Testing Backend API..."
                curl -f http://localhost:3000/api/health || echo "Backend not ready"
                
                echo "Testing Frontend..."
                curl -I http://localhost:5173 2>/dev/null | head -1 || echo "Frontend not ready"
                '''
            }
        }
    }
    
    post {
        always {
            echo "=== Final Container Status ==="
            sh 'docker compose ps'
        }
    }
}
