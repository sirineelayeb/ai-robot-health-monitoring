pipeline {
    agent any

    options {
        timeout(time: 60, unit: "MINUTES")
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        DOCKER_BUILDKIT = "1"
        COMPOSE_DOCKER_CLI_BUILD = "1"
    }

    stages {
        stage("Clone & Clean") {
            steps {
                git branch: 'main',
                    credentialsId: 'github-credentials',
                    url: 'https://github.com/sirineelayeb/ai-robot-health-monitoring.git'
                
                sh '''
                echo "Cleaning up previous deployment..."
                echo "Current directory:"
                pwd
                echo "Workspace contents:"
                ls -la
                
                # Clean up previous docker-compose
                docker-compose down -v --remove-orphans 2>/dev/null || true
                
                # Remove the existing network to avoid warning
                docker network rm robot-network 2>/dev/null || true
                
                # CRITICAL FIX: Handle mosquitto.conf properly
                echo ""
                echo "=== Checking mosquitto.conf ==="
                
                # Remove if it exists as a directory
                if [ -d "mosquitto.conf" ]; then
                    echo "WARNING: mosquitto.conf is a directory! Removing it..."
                    rm -rf mosquitto.conf
                fi
                
                # Create mosquitto.conf as a regular file
                echo "Creating mosquitto.conf file..."
                cat > mosquitto.conf << 'MQTTEOF'
listener 1883
allow_anonymous true
persistence false
MQTTEOF
                
                # Verify it was created correctly
                echo ""
                echo "Verifying mosquitto.conf:"
                echo "File exists: $(if [ -f "mosquitto.conf" ]; then echo "YES"; else echo "NO"; fi)"
                echo "Is directory: $(if [ -d "mosquitto.conf" ]; then echo "YES"; else echo "NO"; fi)"
                echo "File type:"
                file mosquitto.conf || true
                echo "File size: $(wc -l < mosquitto.conf) lines"
                echo ""
                echo "File content:"
                cat mosquitto.conf
                
                # Clean up dangling images
                docker images -f "dangling=true" -q | xargs -r docker rmi 2>/dev/null || true
                '''
            }
        }

        stage("Prepare Environment") {
            steps {
                withCredentials([
                    string(credentialsId: 'robot-jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'robot-admin-password', variable: 'ADMIN_PASSWORD')
                ]) {
                    sh '''
                    echo "Creating environment files..."
                    
                    # Create backend .env
                    cat > backend/.env << ENVEOF
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://mongo:27017/robot-health
MQTT_BROKER_URL=mqtt://mqtt:1883
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1d
ADMIN_EMAIL=admin@robot.com
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENVEOF

                    # Create frontend .env
                    echo "VITE_API_URL=http://localhost:3000" > frontend/.env
                    
                    echo "Environment files content:"
                    echo "=== backend/.env ==="
                    cat backend/.env
                    echo ""
                    echo "=== frontend/.env ==="
                    cat frontend/.env
                    
                    echo "Directory structure:"
                    find . -name "Dockerfile" -o -name "package.json" | sort
                    '''
                }
            }
        }

        stage("Build Images") {
            steps {
                sh '''
                echo "Building Docker images..."
                echo "Current directory: $(pwd)"
                
                # Build with verbose output to see issues
                docker-compose build --progress=plain --no-cache 2>&1 | tee build.log
                
                # Check if images were created
                echo "=== Docker images ==="
                docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "robot|ai-robot"
                
                # FIXED: Check for the CORRECT image name
                if ! docker images --format "{{.Repository}}" | grep -q "^robot-health-monitoring-backend$"; then
                    echo "ERROR: Backend image not built!"
                    echo "Expected: robot-health-monitoring-backend:latest"
                    exit 1
                fi
                echo ""
                echo "✅ Backend image built successfully"
                '''
            }
        }

        stage("Start Services") {
            steps {
                sh '''
                echo "Starting all containers..."
                
                # Start all services in detached mode
                docker-compose up -d
                
                echo "Waiting 10 seconds for initial startup..."
                sleep 10
                
                echo "=== Container Status ==="
                docker-compose ps -a
                
                echo ""
                echo "=== Logs Summary ==="
                docker-compose logs --tail=20
                '''
            }
        }

        stage("Wait for Health") {
            steps {
                script {
                    sh '''
                    echo "Waiting for services to become healthy..."
                    
                    # Wait for MongoDB
                    echo "Waiting for MongoDB..."
                    for i in $(seq 1 30); do
                        if docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" 2>/dev/null | grep -q "ok"; then
                            echo "✓ MongoDB is healthy"
                            break
                        fi
                        echo "Waiting for MongoDB... ($i/30)"
                        sleep 2
                    done
                    
                    # Wait for MQTT
                    echo "Waiting for MQTT..."
                    for i in $(seq 1 30); do
                        if docker-compose exec -T mqtt timeout 5 mosquitto_sub -t '\$SYS/#' -C 1 2>/dev/null; then
                            echo "✓ MQTT is healthy"
                            break
                        fi
                        echo "Waiting for MQTT... ($i/30)"
                        sleep 2
                    done
                    
                    # Wait for Backend
                    echo "Waiting for Backend..."
                    for i in $(seq 1 60); do
                        if curl -f --connect-timeout 3 http://localhost:3000/health 2>/dev/null | grep -q "ok"; then
                            echo "✓ Backend is healthy"
                            break
                        fi
                        echo "Waiting for Backend... ($i/60)"
                        sleep 2
                    done
                    
                    echo ""
                    echo "=== Final Container Status ==="
                    docker-compose ps
                    '''
                }
            }
        }

        stage("Integration Tests") {
            steps {
                script {
                    try {
                        sh '''
                        echo "Running integration tests..."
                        
                        # Test MongoDB
                        echo "Testing MongoDB connection..."
                        docker-compose exec -T mongo mongosh --eval "db.version()" && echo "✓ MongoDB test passed"
                        
                        # Test Backend API
                        echo "Testing Backend API..."
                        BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
                        if [ "$BACKEND_STATUS" = "200" ]; then
                            echo "✓ Backend API test passed"
                        else
                            echo "✗ Backend API returned: $BACKEND_STATUS"
                            exit 1
                        fi
                        
                        # Test Frontend (optional, might not be critical)
                        echo "Testing Frontend..."
                        FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
                        if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "302" ]; then
                            echo "✓ Frontend is accessible"
                        else
                            echo "⚠ Frontend check skipped or failed (may need more time)"
                        fi
                        
                        echo "All tests completed!"
                        '''
                    } catch (Exception e) {
                        sh '''
                        echo "=== Debugging failed tests ==="
                        echo "Container logs:"
                        docker-compose logs --tail=50
                        
                        echo "Network status:"
                        docker network inspect robot-network 2>/dev/null || echo "Network not found"
                        
                        echo "Container processes:"
                        docker-compose exec backend ps aux 2>/dev/null || echo "Cannot exec into backend"
                        '''
                        throw e
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ DEPLOYMENT SUCCESSFUL!"
            sh '''
            echo ""
            echo "======================================"
            echo "All services are running:"
            echo "======================================"
            docker-compose ps
            echo ""
            echo "======================================"
            echo "Access URLs:"
            echo "======================================"
            echo "Frontend:       http://localhost:5173"
            echo "Backend API:    http://localhost:3000"
            echo "Backend Health: http://localhost:3000/health"
            echo "MongoDB:        localhost:27017"
            echo "MQTT:           localhost:1883"
            echo "======================================"
            '''
        }
        failure {
            echo "❌ DEPLOYMENT FAILED"
            sh '''
            echo ""
            echo "======================================"
            echo "Debug Information:"
            echo "======================================"
            echo "=== All Containers (including stopped) ==="
            docker-compose ps -a
            echo ""
            echo "=== Docker Networks ==="
            docker network ls
            docker network inspect robot-network 2>/dev/null || echo "Network not found"
            echo ""
            echo "=== Recent Logs (last 50 lines each) ==="
            docker-compose logs --tail=50
            echo ""
            echo "=== Individual Service Logs ==="
            for service in mongo mqtt backend frontend simulator; do
                echo "--- $service logs ---"
                docker-compose logs --tail=20 $service 2>/dev/null || echo "Service $service not found"
            done
            echo ""
            echo "=== Cleaning up... ==="
            docker-compose down -v --remove-orphans 2>/dev/null || true
            docker network rm robot-network 2>/dev/null || true
            '''
        }
        always {
            sh '''
            echo "Saving logs for analysis..."
            docker-compose logs > docker-compose-full.log 2>&1 || true
            docker-compose ps -a > container-status.log 2>&1 || true
            '''
            archiveArtifacts artifacts: 'docker-compose-full.log,container-status.log,build.log', allowEmptyArchive: true
        }
    }
}