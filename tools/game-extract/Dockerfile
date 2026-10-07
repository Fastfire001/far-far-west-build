FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Extract.csproj .
RUN dotnet restore
COPY Program.cs .
RUN dotnet publish -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/runtime:10.0
COPY --from=build /app /app
# The container runs as the host user, who has no home directory in the image.
ENV HOME=/tmp
ENTRYPOINT ["dotnet", "/app/Extract.dll"]
