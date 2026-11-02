param(
    [Parameter(Mandatory=$false, Position=0)]
    [string]$Email
)

python "$PSScriptRoot\make_admin.py" $Email
