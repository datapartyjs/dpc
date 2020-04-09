  

Usage: dataparty-cli <global-options> \[command\] <command-options>
===================================================================

  Version: 0.4.15
  
  Options:                     
  
    -o, --file        Output to file
    -f, --format      Output format (humanize)
    -j, --json        Short hand for -f=json
    -c, --csv         Short hand for -f=csv
    -h, --humanize    Short hand for -f=humanize
    -t, --table       Short hand for -f=table
  
  Commands:
  
    project init	Initialize secure project
    project show	Show project definition
    project mount	Mount project secrets you have access
    developer add	Add developer to project
    team add	Initialize team
    cloud add	Initialize cloud
    cloud list	List clouds you have access to
    package add	Initialize source package
    service add	Initialize service
  

  
  

Usage: dpc project init \[options\]
===================================

  
  Options:                 
  
    -h, --help    Show help
    -n, --name    Project Name (required)

  

Usage: dpc developer add \[options\]
====================================

    
    Options:                    
    
      -h, --help       Show help
      -e, --email      Developer email (required)
      -k, --keygrip    Developer PGP keygrip
      -d, --discord    Developer discord
      -g, --github     Developer github
  


  

Usage: dpc team add \[options\]
===============================

  
  Options:                   
  
    -h, --help      Show help
    -n, --name      Team Name (required)
    -o, --owner     Team owner
    -m, --member    Team member

  
  

Usage: dpc cloud add \[options\]
================================

  
  Options:                    
  
    -h, --help       Show help
    -n, --name       Cloud Name (required)
    -g, --gce        GCE keyfile in JSON format
    -t, --team       Managing team
    -s, --service    Service deployed to cloud

  
  

Usage: dpc cloud list \[options\]
=================================

  
  Options:                 
  
    -h, --help    Show help

  

Usage: dpc service add \[options\]
==================================

    
    Options:                    
    
      -h, --help       Show help
      -n, --name       Cloud Name (required)
      -p, --package    Package path
