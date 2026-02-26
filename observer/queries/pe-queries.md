# Graylog Queries — Permiso Eventual (PE)

## Service ID
`2c918084887c7a8f01887c99ed2a6fd5`

## Standard Queries

### All PE logs
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5"
```

### Failed bots (status:false)
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"status\":false"
```

### Empty payloads
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"Input payload is empty"
```

### By bot name
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"MINCEX XLS nuevos"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"PERMISO EVENTUAL Listar productos"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"UNIDAD DE MEDIDA Leer"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"Cargar el certificado"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"PERMISO EVENTUAL Crear"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"PERMISO EVENTUAL Crear entries"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"MINCEX DB Crear ejecución"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"VerDatossolicitud"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND actionName:"Mostrar certificado de permiso eventual"
```

### By user
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"claudia"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"alina"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"nelson"
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND user:"camunda"
```

### By dossier
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"ER4044"
```

### Activation errors
```
serviceId:"2c918084887c7a8f01887c99ed2a6fd5" AND message:"was probably just in activation"
```
