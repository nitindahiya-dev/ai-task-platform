# Kubernetes deployment

This folder contains a basic Kubernetes manifest set for the AI task platform.

## Apply the manifests

```bash
kubectl apply -k infra/k8s
```

## Notes

- Replace the placeholder image names with your built image repository if needed.
- Update the values in the Secret manifest before deploying to a real environment.
- The ingress assumes an NGINX ingress controller is installed and uses the host `ai-task-platform.local`.
