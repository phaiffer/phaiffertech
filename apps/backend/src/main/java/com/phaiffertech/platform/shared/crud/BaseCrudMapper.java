package com.phaiffertech.platform.shared.crud;

public interface BaseCrudMapper<E, CreateReq, UpdateReq, Res> {

    E toNewEntity(CreateReq request);

    void updateEntity(E entity, UpdateReq request);

    Res toResponse(E entity);
}
