FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY src/Financas.Domain/Financas.Domain.csproj Financas.Domain/
COPY src/Financas.Application/Financas.Application.csproj Financas.Application/
COPY src/Financas.Infrastructure/Financas.Infrastructure.csproj Financas.Infrastructure/
COPY src/Financas.API/Financas.API.csproj Financas.API/

RUN dotnet restore Financas.API/Financas.API.csproj

COPY src/ .
WORKDIR /src/Financas.API
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "Financas.API.dll"]
