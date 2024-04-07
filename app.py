# Base application structure

from pandalibs.yaml_importer import get_configuration_data
from pandalibs.pprint_nosort import pp

config = get_configuration_data(True)
pp(config)
