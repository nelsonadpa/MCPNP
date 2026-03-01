# Check BPA Status

Check connection status across all configured BPA instances and report health.

## Steps

1. Run `connection_status` to check all instances
2. For each connected instance, run `service_list` to verify API access
3. Report a status table:

| Instance | Connected | Services | Notes |
|----------|-----------|----------|-------|
| cuba     | ...       | ...      | ...   |
| colombia-test | ... | ...      | ...   |
| jamaica  | ...       | ...      | ...   |
| lesotho2 | ...       | ...      | ...   |

4. If any instance is disconnected, attempt `auth_login` and retry
5. Flag any issues (expired auth, unreachable servers, etc.)

$ARGUMENTS
