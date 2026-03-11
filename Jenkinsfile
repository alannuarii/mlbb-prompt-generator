pipeline {
    agent any

    environment {
        APP_NAME = "mlbb-prompt-generator"
        IMAGE_NAME = "mlbb-prompt-generator"
        CONTAINER_PORT = "3000"
        HOST_PORT = "3008"
    }

    stages {
        stage('Checkout') {
            steps {
                // Jenkins handles checkout automatically for Multibranch Pipeline or SCM job
                echo "Checkout code complete."
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker Image: ${IMAGE_NAME}:${env.BUILD_NUMBER}"
                    sh "docker build -t ${IMAGE_NAME}:${env.BUILD_NUMBER} ."
                    sh "docker tag ${IMAGE_NAME}:${env.BUILD_NUMBER} ${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Deploying container using Jenkins Credentials..."
                    
                    // Stop and remove existing container if it exists
                    sh "docker stop ${APP_NAME} || true"
                    sh "docker rm ${APP_NAME} || true"

                    // Use credentials from Jenkins store
                    withCredentials([
                        string(credentialsId: 'mlbb-gemini-api-key', variable: 'API_KEY')
                    ]) {
                        // Run the new container with injected environment variables
                        sh """
                            docker run -d \\
                            --name ${APP_NAME} \\
                            --restart always \\
                            -p ${HOST_PORT}:${CONTAINER_PORT} \\
                            -e MLBB_GEMINI_API_KEY=${API_KEY} \\
                            ${IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            // Optional: Clean up workspace if needed
            // cleanWs()
            echo "Pipeline finished."
        }
        success {
            echo "Application successfully deployed!"
        }
        failure {
            echo "Deployment failed. Check the logs."
        }
    }
}
